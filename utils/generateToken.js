require('dotenv').config();
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id, 
      role:user.role
    }, 
      process.env.JWT_SECRET,
    { 
      expiresIn: '72h' // expires in three days - after that they need to access again
    }
  );
}

module.exports = generateToken;