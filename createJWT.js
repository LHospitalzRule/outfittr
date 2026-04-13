const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.createToken = function (fn, ln, id) {
    return _createToken(fn, ln, id);
}
_createToken = function (fn, ln, id) {
    try {
        const expiration = new Date();
        const user = { userId: id, firstName: fn, lastName: ln };
        
        const accessToken= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30m'} );    
        
        var ret = { accessToken: accessToken };
    }
    catch (e) {
        var ret = { error: e.message };
    }
    return ret;
}
exports.isExpired = function (token) {
    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return false;
    }
    catch (e) {
        return true;
    }
}
exports.refresh = function (token) {
    if (!token) {
        throw new Error("Missing token");
    }

    var ud = jwt.decode(token, { complete: true });
    var userId = ud.payload.userId;
    var firstName = ud.payload.firstName;
    var lastName = ud.payload.lastName;
    return _createToken(firstName, lastName, userId);
}


