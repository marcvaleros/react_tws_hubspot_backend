require('dotenv').config();
const jwt = require('jsonwebtoken');

const authenticateJWT = (req,res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];  // Extract token from Authorization header
  // console.log(`This is the token from the request header: ${token}\n`);

  if(token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if(err) {
        console.error('Token verification failed', err);
        return res.sendStatus(403); // Forbidden
      }
      console.log(`User from jwt: ${JSON.stringify(user,null,2)}`);
      req.user = user;
      next();
    });
  }else{
    res.sendStatus(401); //unauthorized
  }
} 

module.exports = {
  authenticateJWT
}