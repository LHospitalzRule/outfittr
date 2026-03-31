require('express');
require('mongodb');
var token = require('./createJWT.js');

exports.setApp = function (app, client) {

    // ─── LOGIN ───────────────────────────────────────────────────────────────────
    app.post('/api/login', async (req, res, next) => {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error
        const { login, password } = req.body;
        const db = client.db('OutfittrDB');
        const results = await db.collection('Users')
            .find({ login: login, password: password })
            .toArray();

        console.log(results[0]); // debug line
        var id = -1;
        var fn = '';
        var ln = '';
        var ret;

        if (results.length > 0) {
            id = results[0]._id;
            fn = results[0].firstName;
            ln = results[0].lastName;
            try {
                ret = token.createToken(fn, ln, id);
            } catch (e) {
                ret = { error: e.message };
            }
        } else {
            ret = { error: 'Login/Password incorrect' };
        }

        res.status(200).json(ret);
    });

    // ─── REGISTER ─────────────────────────────────────────────────────────────
    app.post('/api/register', async (req, res, next) => {
        // incoming: login, password, firstName, lastName
        // outgoing: error, jwtToken
        const { login, password, firstName, lastName } = req.body;

        try {
            const db = client.db('OutfittrDB');

            // ensure login is unique
            const existing = await db.collection('Users').findOne({ login: login });
            if (existing) {
                res.status(200).json({ error: 'Login already exists', jwtToken: '' });
                return;
            }

            const newUser = { login: login, password: password, firstName: firstName, lastName: lastName };
            const result = await db.collection('Users').insertOne(newUser);

            const id = result.insertedId;
            var ret;
            try {
                ret = token.createToken(firstName, lastName, id);
            } catch (e) {
                ret = { error: e.message, jwtToken: '' };
            }

            res.status(200).json(ret);
        } catch (e) {
            res.status(500).json({ error: e.toString(), jwtToken: '' });
        }
    });

    // ─── ADD ITEM ─────────────────────────────────────────────────────────────────
    app.post('/api/additem', async (req, res, next) => {
        // incoming: userId, item, jwtToken
        // outgoing: error, jwtToken
        const { userId, item, jwtToken } = req.body;

        // JWT expiry check
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        } catch (e) {
            console.log(e.message);
        }

        const newItem = { Item: item, UserId: userId };
        var error = '';

        try {
            const db = client.db('OutfittrDB');
            const result = await db.collection('Items').insertOne(newItem);
        } catch (e) {
            error = e.toString();
        }

        // Refresh token
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });

    // ─── SEARCH ITEMS ─────────────────────────────────────────────────────────────
    app.post('/api/searchitems', async (req, res, next) => {
        // incoming: userId, search, jwtToken
        // outgoing: results[], error, jwtToken
        var error = '';
        const { userId, search, jwtToken } = req.body;

        // JWT expiry check
        try {
            if (token.isExpired(jwtToken)) {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        } catch (e) {
            console.log(e.message);
        }

        var _search = search.trim();
        const db = client.db('OutfittrDB');
        const results = await db.collection('Items')
            .find({ "Item": { $regex: _search + '.*', $options: 'i' } })
            .toArray();

        var _ret = [];
        for (var i = 0; i < results.length; i++) {
            _ret.push(results[i].Item);
        }

        // Refresh token
        var refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        } catch (e) {
            console.log(e.message);
        }

        var ret = { results: _ret, error: error, jwtToken: refreshedToken };
        res.status(200).json(ret);
    });
}

// app.post('/api/additem', async (req, res) => {
//     const { userId, item } = req.body;
//     const newItem = { Item: item, UserId: userId };

    

//     try {
//         const db = client.db('OutfittrDB');
//         await db.collection('Items').insertOne(newItem);
//         res.status(200).json({ error: '' });
//     } catch (e) {
//         res.status(500).json({ error: e.toString() });
//     }
// });


// app.post('/api/login', async (req, res, next) => {
//     // incoming: login, password
//     // outgoing: id, firstName, lastName, error
//     var error = '';
//     const { login, password } = req.body;
//     const db = client.db('OutfittrDB');
//     const results = await
//         db.collection('Users').find({ Login: login, Password: password }).toArray
//             ();
//     var id = -1;
//     var fn = '';
//     var ln = '';
//     var ret;
//     if (results.length > 0) {
//         id = results[0].UserId;
//         fn = results[0].FirstName;
//         ln = results[0].LastName;
//         try {
//             const token = require("./createJWT.js");
//             ret = token.createToken(fn, ln, id);
//         }
//         catch (e) {
//             ret = { error: e.message };
//         }
//     }
//     else {
//         ret = { error: "Login/Password incorrect" };
//     }
//     res.status(200).json(ret);
// });

// app.post('/api/searchitems', async (req, res) => {
//     const { userId, search } = req.body;
//     const _search = search.trim();

//     try {
//         const db = client.db('OutfittrDB');
//         const results = await db.collection('Items')
//             .find({ "Item": { $regex: _search + '.*', $options: 'i' } })
//             .toArray();

//         const itemNames = results.map(doc => doc.Item);
//         res.status(200).json({ results: itemNames, error: '' });
//     } catch (e) {
//         res.status(500).json({ error: e.toString() });
//     }
// });

// require('express');
// require('mongodb');
// exports.setApp = function (app, client) {
//     app.post('/api/additem', async (req, res, next) => {
//         // incoming: userId, color
//         // outgoing: error
//         const { userId, item } = req.body;
//         const newItem = { Item: item, UserId: userId };
//         var error = '';
//         try {
//             const db = client.db('OutfittrDB');
//             const result = db.collection('Items').insertOne(newItem);
//         }
//         catch (e) {
//             error = e.toString();
//         }
//         itemList.push(item);
//         var ret = { error: error };
//         res.status(200).json(ret);
//     });
//     app.post('/api/login', async (req, res, next) => {
//         // incoming: login, password
//         // outgoing: id, firstName, lastName, error
//         var error = '';
//         const { login, password } = req.body;
//         const db = client.db('OutfittrDB');
//         const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();
//         var id = -1;
//         var fn = '';
//         var ln = '';
//         if (results.length > 0) {
//             id = results[0].UserID;
//             fn = results[0].FirstName;
//             ln = results[0].LastName;
//         }
//         var ret = { id: id, firstName: fn, lastName: ln, error: '' };
//         res.status(200).json(ret);
//     });
//     app.post('/api/searchitems', async (req, res, next) => {
//         // incoming: userId, search
//         // outgoing: results[], error
//         var error = '';
//         const { userId, search } = req.body;
//         var _search = search.trim();
//         const db = client.db('OutfittrDB');
//         const results = await db.collection('Items').find({ "Item": { $regex: _search + '.*', $options: 'i' } }).toArray();
//         var _ret = [];
//         for (var i = 0; i < results.length; i++) {
//             _ret.push(results[i].Item);
//         }
//         var ret = { results: _ret, error: error };
//         res.status(200).json(ret);
//     });
// }