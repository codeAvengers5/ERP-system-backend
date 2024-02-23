const jwt = require("jsonwebtoken");

async function generateToken(payload, res) {
  const token = jwt.sign(payload, process.env.JWT_TOKEN_KEY, {
    expiresIn: "7d",
  });
  return token;
}

module.exports = generateToken;
