app.post('/api/additem', async (req, res) => {
    const { userId, item } = req.body;
    const newItem = { Item: item, UserId: userId };

    try {
        const db = client.db('OutfittrDB');
        // 2. Added 'await' so the record actually saves before we respond
        await db.collection('Items').insertOne(newItem);
        res.status(200).json({ error: '' });
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const db = client.db('OutfittrDB');
        const user = await db.collection('Users').findOne({ Login: login, Password: password });

        if (user) {
            res.status(200).json({
                id: user.UserID, // Ensure your DB field is 'UserID' and not '_id'
                firstName: user.FirstName,
                lastName: user.LastName,
                error: ''
            });
        } else {
            res.status(401).json({ error: 'Invalid login/password' });
        }
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/searchitems', async (req, res) => {
    const { userId, search } = req.body;
    const _search = search.trim();

    try {
        const db = client.db('OutfittrDB');
        const results = await db.collection('Items')
            .find({ "Item": { $regex: _search + '.*', $options: 'i' } })
            .toArray();

        // Use .map() for a cleaner way to extract just the item names
        const itemNames = results.map(doc => doc.Item);
        res.status(200).json({ results: itemNames, error: '' });
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

require('express');
require('mongodb');
exports.setApp = function (app, client) {
    app.post('/api/additem', async (req, res, next) => {
        // incoming: userId, color
        // outgoing: error
        const { userId, item } = req.body;
        const newItem = { Item: item, UserId: userId };
        var error = '';
        try {
            const db = client.db('OutfittrDB');
            const result = db.collection('Items').insertOne(newItem);
        }
        catch (e) {
            error = e.toString();
        }
        itemList.push(item);
        var ret = { error: error };
        res.status(200).json(ret);
    });
    app.post('/api/login', async (req, res, next) => {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error
        var error = '';
        const { login, password } = req.body;
        const db = client.db('OutfittrDB');
        const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();
        var id = -1;
        var fn = '';
        var ln = '';
        if (results.length > 0) {
            id = results[0].UserID;
            fn = results[0].FirstName;
            ln = results[0].LastName;
        }
        var ret = { id: id, firstName: fn, lastName: ln, error: '' };
        res.status(200).json(ret);
    });
    app.post('/api/searchitems', async (req, res, next) => {
        // incoming: userId, search
        // outgoing: results[], error
        var error = '';
        const { userId, search } = req.body;
        var _search = search.trim();
        const db = client.db('OutfittrDB');
        const results = await db.collection('Items').find({ "Item": { $regex: _search + '.*', $options: 'i' } }).toArray();
        var _ret = [];
        for (var i = 0; i < results.length; i++) {
            _ret.push(results[i].Item);
        }
        var ret = { results: _ret, error: error };
        res.status(200).json(ret);
    });
}