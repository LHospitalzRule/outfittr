const jwt = require("jsonwebtoken");
require("dotenv").config();

function signToken(userId) {
    return jwt.sign(
        { userId: String(userId) },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30m" }
    );
}

exports.createToken = function createToken(id) {
    return { accessToken: signToken(id) };
};

exports.isExpired = function isExpired(token) {
    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return false;
    } catch (error) {
        return true;
    }
};

exports.refresh = function refresh(token) {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return { accessToken: signToken(payload.userId) };
};
