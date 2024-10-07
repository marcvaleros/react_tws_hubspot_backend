const User = require('../models/user');

const getUserById = async (req, res) => {
  try {
    const userId = req.user.sub;  // use userID from JWT
    console.log(`User ID from JWT: ${userId}`);
    
    const user = await User.findOne({where: {id: userId}});
    if(!user) {
      return res.sendStatus(404);
    }

    res.json(user);
  } catch (error) {
    console.error('Error Fetching User:', error);
    res.sendStatus(500);
  }
}

module.exports = {
  getUserById
}