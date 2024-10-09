const {TWSFranchisee, User} = require('../models');

const getUserById = async (req, res) => {
  try {
    const userId = req.user.id; 
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

const getAllUsers = async (req,res) => {
  try {
    const users = await User.findAll({
      include: {
        model: TWSFranchisee,
        as: 'franchisee',
        attributes: ['name', 'hubspot_api_key']
      }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error Fetching User:', error);
    res.status(500).json({message: 'Internal Server Error'});
  }
}

module.exports = {
  getUserById,
  getAllUsers
}