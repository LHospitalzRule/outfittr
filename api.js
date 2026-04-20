require('express');
const crypto = require('crypto');
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
        return password === storedPassword;
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

            // Upgrade legacy plaintext passwords to a hashed format after a successful login.
            if (typeof user.password === 'string' && !user.password.startsWith('scrypt$')) {
                const hashedPassword = await hashPassword(password);
                await db.collection('Users').updateOne(
                    { _id: user._id },
                    { $set: { password: hashedPassword } }
                );
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
            const newUser = {
                email: email,
                password: hashedPassword
            };

            const result = await db.collection('Users').insertOne(newUser);
            const id = result.insertedId;

            var ret;
            try {
                ret = token.createToken(id);
            } catch (e) {
                ret = { error: e.message, accessToken: '' };
            }

            res.status(200).json(ret);
        } catch (e) {
            res.status(500).json({ error: e.toString(), accessToken: '' });
        }
    });

    // ─── ADD ITEM ─────────────────────────────────────────────────────────────────
    app.post('/api/additem', upload.single('image'), async (req, res, next) => {
        const { userId, name, type, tags, notes, jwtToken } = req.body;

        // Note: Because jwtToken is inside the FormData body, multer MUST run first to parse it.
        // In the future, passing tokens in the 'Authorization' header instead of req.body 
        // will allow you to validate the token BEFORE multer uploads the file to Cloudinary.
        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        //extract Cloudinary URL using secure_url fallback
        const imageURL = getImageUrl(req);

        const formattedTags = parseTags(tags);

        const newItem = { 
            UserId: userId, 
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
            refreshedToken = token.refresh(jwtToken);
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
        const { userId, itemId, name, type, tags, notes, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
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
            const filter = { _id: new ObjectId(itemId), UserId: userId };

            const existingItem = await items.findOne(filter);
            if (!existingItem) {
                throw new Error('Item not found');
            }

            const updateDoc = {
                UserId: userId,
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
            refreshedToken = token.refresh(jwtToken);
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
    
    //added upload.none() to allow Express to read FormData from the frontend
    app.post('/api/searchitems', upload.none(), async (req, res) => {
        const { userId, search, jwtToken } = req.body;

        if (token.isExpired(jwtToken)) {
            return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
        }

        const db = client.db('OutfittrDB');
        const _search = search ? search.trim() : "";

        const results = await db.collection('Items')
            .find({
                UserId: userId,
                "name": { $regex: _search + '.*', $options: 'i' }
            })
            .toArray();

        let refreshedToken = { accessToken: '' };
        try {
            refreshedToken = token.refresh(jwtToken);
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
