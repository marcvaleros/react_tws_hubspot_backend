require('dotenv').config();
const jwt = require('jsonwebtoken');

const generateToken = async (user) => {
  return jwt.sign({id: user.id, role:user.role, email: user.email}, process.env.JWT_SECRET, {
      expiresIn: '72h' // expires in three days - after that they need to access again
    }
  );
}

module.exports = generateToken;