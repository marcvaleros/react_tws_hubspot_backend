require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');

const encryptedData = JSON.parse(fs.readFileSync('credentials/credentials.enc.json', 'utf8'));
const key = process.env.ENCRYPTION_KEY;

const decrypt = (encrypted, key) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(encrypted.iv, 'hex'));
  let decrypted = decipher.update(Buffer.from(encrypted.content, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const getCredentials = () => {
  const decryptedData = decrypt(encryptedData, key);
  console.log(`File decrypted and saved`);
  return decryptedData;
} 

module.exports ={
  getCredentials
}
