require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const { storage } = require('./cloudinaryConfig');
const upload = multer({ storage });
var token = require('./createJWT.js');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

const PASSWORD_REQUIREMENTS_MESSAGE =
    'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character.';

function isPasswordValid(password) {
    return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(password || '');
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, 64);

    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== 'string' || storedPassword.length === 0) {
        return false;
    }

    if (!storedPassword.startsWith('scrypt$')) {
        if (typeof password !== 'string') {
            return false;
        }

        const passwordBuffer = Buffer.from(String(password), 'utf8');
        const storedPasswordBuffer = Buffer.from(storedPassword, 'utf8');

        if (passwordBuffer.length !== storedPasswordBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual(passwordBuffer, storedPasswordBuffer);
    }

    const parts = storedPassword.split('$');
    if (parts.length !== 3) {
        return false;
    }

    const [, salt, storedHashHex] = parts;
    const derivedKey = await scryptAsync(password, salt, 64);
    const storedHash = Buffer.from(storedHashHex, 'hex');

    if (storedHash.length !== derivedKey.length) {
        return false;
    }

    return crypto.timingSafeEqual(storedHash, derivedKey);
}

function parseTags(tags) {
    if (Array.isArray(tags)) {
        return tags;
    }

    if (typeof tags === 'string' && tags.trim() !== '') {
        try {
            const parsedTags = JSON.parse(tags);
            if (Array.isArray(parsedTags)) {
                return parsedTags.map(tag => String(tag).trim()).filter(Boolean);
            }
        } catch (e) {
            return tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
    }

    return [];
}

function parseItemIds(itemIds) {
    if (Array.isArray(itemIds)) {
        return itemIds.map(id => String(id).trim()).filter(Boolean);
    }

    if (typeof itemIds === 'string' && itemIds.trim() !== '') {
        try {
            const parsedItemIds = JSON.parse(itemIds);
            if (Array.isArray(parsedItemIds)) {
                return parsedItemIds.map(id => String(id).trim()).filter(Boolean);
            }
        } catch (e) {
            return itemIds.split(',').map(id => id.trim()).filter(Boolean);
        }
    }

    return [];
}

async function getOutfitItems(db, userId, itemIds) {
    const validIds = itemIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));

    if (validIds.length === 0) {
        return [];
    }

    const items = await db.collection('Items')
        .find({
            _id: { $in: validIds },
            UserId: userId
        })
        .toArray();

    const itemMap = new Map(items.map(item => [item._id.toString(), item]));
    return itemIds.map(id => itemMap.get(id)).filter(Boolean);
}

async function buildOutfitResponse(db, outfitDoc) {
    const itemIds = parseItemIds(outfitDoc.itemIds || outfitDoc.item_IDs || []);
    const items = await getOutfitItems(db, outfitDoc.UserId, itemIds);

    return {
        ...outfitDoc,
        outfitId: outfitDoc.outfitId || (outfitDoc._id ? outfitDoc._id.toString() : ''),
        itemIds: itemIds,
        items: items
    };
}

function getImageUrl(req) {
    const filePath = req.file && req.file.path ? req.file.path : '';

    return req.file
        ? (req.file.secure_url || (filePath.startsWith('http')
            ? filePath
            : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`))
        : '';
}

function getVerificationExpiry() {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

function getVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

function getVerificationLink(tokenValue) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl}/verify?token=${tokenValue}`;
}

function getMailer() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

async function sendVerificationEmail(email, verificationLink) {
    const transporter = getMailer();

    if (!transporter) {
        console.log(`Verification link for ${email}: ${verificationLink}`);
        return;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Outfittr <no-reply@example.com>',
        to: email,
        subject: 'Verify your Outfittr account',
        text: `Verify your email by visiting: ${verificationLink}`
    });
}

function getBearerToken(req) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        return '';
    }

    return header.slice(7).trim();
}

function resolveAuth(req) {
    const bearerToken = getBearerToken(req);
    if (bearerToken) {
        if (token.isExpired(bearerToken)) {
            return { error: 'The JWT is no longer valid' };
        }

        try {
            const payload = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);
            return {
                userId: String(payload.userId),
                jwtToken: bearerToken
            };
        } catch (e) {
            return { error: 'The JWT is no longer valid' };
        }
    }

    const userId = req.body.userId;
    const jwtToken = req.body.jwtToken;
    if (token.isExpired(jwtToken)) {
        return { error: 'The JWT is no longer valid' };
    }

    return { userId: userId, jwtToken: jwtToken };
}


exports.setApp = function (app, client) {

    // ─── LOGIN ───────────────────────────────────────────────────────────────────
    app.post('/api/login', async (req, res, next) => {
        const { login, password } = req.body; 
        const db = client.db('OutfittrDB');
        
        try {
            const user = await db.collection('Users').findOne({ email: login });

            if (!user || !(await verifyPassword(password, user.password))) {
                res.status(401).json({ error: 'Email/Password incorrect' });
                return;
            }

            // Upgrade legacy non-scrypt passwords to a hashed format after a successful login.
            if (typeof user.password === 'string' && !user.password.startsWith('scrypt$')) {
                const hashedPassword = await hashPassword(password);
                await db.collection('Users').updateOne(
                    { _id: user._id },
                    { $set: { password: hashedPassword } }
                );
            }

            if (user.verified !== true) {
                return res.status(403).json({ error: 'Please verify your email before logging in' });
            }

            const ret = token.createToken(user._id);
            res.status(200).json(ret);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // ─── REGISTER ─────────────────────────────────────────────────────────────
    app.post('/api/register', async (req, res, next) => {
        const { email, password } = req.body;

        try {
            const db = client.db('OutfittrDB');

            const existing = await db.collection('Users').findOne({ email: email });
            if (existing) {
                res.status(200).json({ error: 'Email already exists', accessToken: '' });
                return;
            }
            
            if (!isPasswordValid(password)) {
                res.status(200).json({ error: PASSWORD_REQUIREMENTS_MESSAGE, accessToken: '' });
                return;
            }

            const hashedPassword = await hashPassword(password);
            const verificationToken = getVerificationToken();
            const verificationExpires = getVerificationExpiry();
            await db.collection('Users').insertOne({
                email: email,
                password: hashedPassword,
                verified: false,
                verificationToken: verificationToken,
                verificationExpires: verificationExpires
            });

            const verificationLink = getVerificationLink(verificationToken);
            await sendVerificationEmail(email, verificationLink);

            return res.status(200).json({
                error: '',
                message: 'Check your email for a verification link.'
            });
        } catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    app.get('/api/verify', async (req, res) => {
        const verificationToken = req.query.token;

        if (!verificationToken) {
            return res.status(400).json({ error: 'Missing verification token' });
        }

        try {
            const db = client.db('OutfittrDB');
            const user = await db.collection('Users').findOne({ verificationToken: verificationToken });

            if (!user) {
                return res.status(400).json({ error: 'Invalid verification token' });
            }

            if (!user.verificationExpires || new Date(user.verificationExpires) < new Date()) {
                return res.status(400).json({ error: 'Verification token has expired' });
            }

            await db.collection('Users').updateOne(
                { _id: user._id },
                {
                    $set: { verified: true },
                    $unset: { verificationToken: '', verificationExpires: '' }
                }
            );

            return res.status(200).json({ message: 'Email verified successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Unable to verify email' });
        }
    });

    app.post('/api/resend-verification', async (req, res) => {
        const { email } = req.body;

        try {
            const db = client.db('OutfittrDB');
            const user = await db.collection('Users').findOne({ email: email });

            if (user && user.verified !== true) {
                const verificationToken = getVerificationToken();
                const verificationExpires = getVerificationExpiry();

                await db.collection('Users').updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            verificationToken: verificationToken,
                            verificationExpires: verificationExpires
                        }
                    }
                );

                const verificationLink = getVerificationLink(verificationToken);
                await sendVerificationEmail(email, verificationLink);
            }

            return res.status(200).json({
                message: 'If that account exists and is not verified, a new verification email has been sent.'
            });
        } catch (e) {
            return res.status(500).json({ error: 'Unable to resend verification email' });
        }
    });

    app.get('/api/me', async (req, res) => {
        const bearerToken = getBearerToken(req);
        if (!bearerToken) {
            return res.status(401).json({ error: 'Missing authorization token' });
        }

        if (token.isExpired(bearerToken)) {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }

        try {
            const payload = jwt.verify(bearerToken, process.env.ACCESS_TOKEN_SECRET);
            const db = client.db('OutfittrDB');
            const user = await db.collection('Users').findOne({ _id: new ObjectId(payload.userId) });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({
                userId: String(user._id),
                email: user.email,
                verified: user.verified === true
            });
        } catch (e) {
            return res.status(401).json({ error: 'Token expired or invalid' });
        }
    });

    // ─── ADD ITEM ─────────────────────────────────────────────────────────────────
    app.post('/api/additem', upload.single('image'), async (req, res, next) => {
        const { name, type, tags, notes } = req.body;
        const auth = resolveAuth(req);

        if (auth.error) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        // Extract Cloudinary URL using secure_url fallback
        const imageURL = getImageUrl(req);

        const formattedTags = parseTags(tags);

        const newItem = { 
            UserId: auth.userId,
            name: name,
            type: type,
            tags: formattedTags, 
            notes: notes,
            imageURL: imageURL 
        };

        let error = '';
        try {
            const db = client.db('OutfittrDB');
            const result = await db.collection('Items').insertOne(newItem);
            newItem.itemId = result.insertedId.toString();
        } catch (e) {
            error = e.toString();
        }

        // Refresh Token
        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(auth.jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({ 
            error: error, 
            accessToken: refreshedToken.accessToken,
            id: newItem.itemId,
            imageURL: newItem.imageURL,
            item: newItem 
        });
    });

    // ─── EDIT ITEM ────────────────────────────────────────────────────────────────
    app.post('/api/edititem', upload.single('image'), async (req, res, next) => {
        const { itemId, name, type, tags, notes } = req.body;
        const auth = resolveAuth(req);

        if (auth.error) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        let error = '';
        let updatedItem = null;

        try {
            if (!itemId || !ObjectId.isValid(itemId)) {
                throw new Error('Valid itemId is required');
            }

            const db = client.db('OutfittrDB');
            const items = db.collection('Items');
            const filter = { _id: new ObjectId(itemId), UserId: auth.userId };

            const existingItem = await items.findOne(filter);
            if (!existingItem) {
                throw new Error('Item not found');
            }

            const updateDoc = {
                UserId: auth.userId,
                name: name,
                type: type,
                tags: parseTags(tags),
                notes: notes,
                imageURL: req.file ? getImageUrl(req) : (existingItem.imageURL || '')
            };

            await items.updateOne(filter, { $set: updateDoc });
            updatedItem = { ...updateDoc, itemId: itemId };
        } catch (e) {
            error = e.toString();
        }

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(auth.jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({
            error: error,
            accessToken: refreshedToken.accessToken,
            id: updatedItem ? updatedItem.itemId : '',
            imageURL: updatedItem ? updatedItem.imageURL : '',
            item: updatedItem
        });
    });

    // ─── DELETE ITEM ──────────────────────────────────────────────────────────────
    app.post('/api/deleteitem', upload.none(), async (req, res, next) => {
        const { userId, itemId, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        let error = '';
        let deleted = false;

        try {
            if (!itemId || !ObjectId.isValid(itemId)) {
                throw new Error('Valid itemId is required');
            }

            const db = client.db('OutfittrDB');
            const result = await db.collection('Items').deleteOne({
                _id: new ObjectId(itemId),
                UserId: userId
            });

            if (result.deletedCount === 0) {
                throw new Error('Item not found');
            }

            deleted = true;
        } catch (e) {
            error = e.toString();
        }

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({
            error: error,
            accessToken: refreshedToken.accessToken,
            id: itemId || '',
            deleted: deleted
        });
    });

    // ─── SEARCH ITEMS ─────────────────────────────────────────────────────────────
    
    // Added upload.none() to allow Express to read FormData from the frontend
    app.post('/api/searchitems', upload.none(), async (req, res) => {
        const { search } = req.body;
        const auth = resolveAuth(req);

        if (auth.error) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        const db = client.db('OutfittrDB');
        const _search = search ? search.trim() : "";

        const results = await db.collection('Items')
            .find({
                UserId: auth.userId,
                "name": { $regex: _search + '.*', $options: 'i' }
            })
            .toArray();

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(auth.jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({ results: results, error: '', accessToken: refreshedToken.accessToken });
    });

    // ─── ADD OUTFIT ───────────────────────────────────────────────────────────────
    app.post('/api/addoutfit', upload.none(), async (req, res, next) => {
        const { userId, name, description, itemIds, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        const parsedItemIds = parseItemIds(itemIds);
        const newOutfit = {
            UserId: userId,
            name: name,
            description: description || '',
            itemIds: parsedItemIds
        };

        let error = '';
        let responseOutfit = null;
        try {
            const db = client.db('OutfittrDB');

            if (parsedItemIds.some(id => !ObjectId.isValid(id))) {
                throw new Error('One or more itemIds are invalid');
            }

            const outfitItems = await getOutfitItems(db, userId, parsedItemIds);
            if (outfitItems.length !== parsedItemIds.length) {
                throw new Error('One or more items were not found');
            }

            const result = await db.collection('Outfits').insertOne(newOutfit);
            responseOutfit = await buildOutfitResponse(db, {
                ...newOutfit,
                _id: result.insertedId
            });
        } catch (e) {
            error = e.toString();
        }

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({
            error: error,
            accessToken: refreshedToken.accessToken,
            id: responseOutfit ? responseOutfit.outfitId : '',
            outfit: responseOutfit
        });
    });

    // ─── EDIT OUTFIT ──────────────────────────────────────────────────────────────
    app.post('/api/editoutfit', upload.none(), async (req, res, next) => {
        const { userId, outfitId, name, description, itemIds, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        let error = '';
        let updatedOutfit = null;

        try {
            if (!outfitId || !ObjectId.isValid(outfitId)) {
                throw new Error('Valid outfitId is required');
            }

            const db = client.db('OutfittrDB');
            const outfits = db.collection('Outfits');
            const filter = { _id: new ObjectId(outfitId), UserId: userId };

            const existingOutfit = await outfits.findOne(filter);
            if (!existingOutfit) {
                throw new Error('Outfit not found');
            }

            const parsedItemIds = parseItemIds(
                itemIds !== undefined ? itemIds : (existingOutfit.itemIds || existingOutfit.item_IDs || [])
            );

            if (parsedItemIds.some(id => !ObjectId.isValid(id))) {
                throw new Error('One or more itemIds are invalid');
            }

            const outfitItems = await getOutfitItems(db, userId, parsedItemIds);
            if (outfitItems.length !== parsedItemIds.length) {
                throw new Error('One or more items were not found');
            }

            const updateDoc = {
                UserId: userId,
                name: name !== undefined ? name : (existingOutfit.name || ''),
                description: description !== undefined ? description : (existingOutfit.description || ''),
                itemIds: parsedItemIds
            };

            await outfits.updateOne(filter, { $set: updateDoc });
            updatedOutfit = await buildOutfitResponse(db, { ...updateDoc, _id: new ObjectId(outfitId) });
        } catch (e) {
            error = e.toString();
        }

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({
            error: error,
            accessToken: refreshedToken.accessToken,
            id: updatedOutfit ? updatedOutfit.outfitId : '',
            outfit: updatedOutfit
        });
    });

    // ─── DELETE OUTFIT ────────────────────────────────────────────────────────────
    app.post('/api/deleteoutfit', upload.none(), async (req, res, next) => {
        const { userId, outfitId, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        let error = '';
        let deleted = false;

        try {
            if (!outfitId || !ObjectId.isValid(outfitId)) {
                throw new Error('Valid outfitId is required');
            }

            const db = client.db('OutfittrDB');
            const result = await db.collection('Outfits').deleteOne({
                _id: new ObjectId(outfitId),
                UserId: userId
            });

            if (result.deletedCount === 0) {
                throw new Error('Outfit not found');
            }

            deleted = true;
        } catch (e) {
            error = e.toString();
        }

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({
            error: error,
            accessToken: refreshedToken.accessToken,
            id: outfitId || '',
            deleted: deleted
        });
    });

    // ─── SEARCH OUTFITS ───────────────────────────────────────────────────────────
    app.post('/api/searchoutfits', upload.none(), async (req, res) => {
        const { userId, search, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        const db = client.db('OutfittrDB');
        const _search = search ? search.trim() : "";

        let results = [];
        let error = '';

        try {
            const outfits = await db.collection('Outfits')
                .find({
                    UserId: userId,
                    name: { $regex: _search + '.*', $options: 'i' }
                })
                .toArray();

            results = await Promise.all(outfits.map(outfit => buildOutfitResponse(db, outfit)));
        } catch (e) {
            error = e.toString();
        }

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log("Refresh error: " + e.message);
        }

        res.status(200).json({ results: results, error: error, accessToken: refreshedToken.accessToken });
    });
}
