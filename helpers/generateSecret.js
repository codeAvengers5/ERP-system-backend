const crypto = require("crypto");
const { encode } = require("hi-base32");

const generateBase32Secret = () => {
    const buffer = crypto.randomBytes(15);
    return encode(buffer).replace(/=/g, "").substring(0, 24);
};

module.exports = generateBase32Secret;