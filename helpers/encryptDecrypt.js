const crypto = require("crypto");

const algorithm = "aes-256-gcm";
function generateBackupCodes(secretCode, numCodes = 5) {
  const backupCodes = [];
  for (let i = 0; i < numCodes; i++) {
    const backupCode = generateSixDigitCode(secretCode, i);
    backupCodes.push(backupCode);
  }
  return backupCodes;
}

function generateSixDigitCode(secretCode, index) {
  const hash = crypto.createHmac('sha256', secretCode)
    .update(`${index}`)
    .digest('hex');
  const decimal = parseInt(hash.slice(0, 6), 16);
  return decimal % 1000000;
}
function getHashString(input) {
  const hash = crypto.createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

function encrypt(text, password) {
  const iv = crypto.randomBytes(16).toString("hex");
  const cipher = crypto.createCipheriv(algorithm, password, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv}.${tag}.${encrypted}`;
}

function decrypt(encryptedData, password) {
  const [iv, tag, content] = encryptedData.split(".");
  let decipher = crypto.createDecipheriv(algorithm, password, iv);
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  let dec = decipher.update(content, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

module.exports = {
  generateBackupCodes,
  getHashString,
  encrypt,
  decrypt,
};
