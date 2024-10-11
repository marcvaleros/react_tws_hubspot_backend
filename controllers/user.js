const {TWSFranchisee, User, Setting} = require('../models');

const getUserById = async (req, res) => {
  try {
    const userId = req.user.id; 
    const user = await User.findOne({where: {id: userId},   
      include: {
        model: TWSFranchisee,
        as: 'franchisee',
        attributes: ['name', 'hubspot_api_key'],
        include: {
          model: Setting,
          as: 'settings',
          attributes: ['zips','projectTypes','buildingUses', 'dealStageId']
        }
    }});
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

const updateUserAssociation = async (req,res) => {
  const { user_id, tws_id } = req.params;
  try {
    const user = await User.findByPk(user_id);
    if(!user) {
      return res.status(404).json({message: 'User not found'});
    }

    if(tws_id !== undefined){
      user.assoc_tws = tws_id;
    }else{
      console.log(`Undefined Association ID`);
    }

    await user.save();
    return res.status(200).json({message: 'User updated successfully', user});
  } catch (error) {
    console.error('Error Updating User:', error);
    res.status(500).json({message: 'Internal Server Error'});
  }
}

module.exports = {
  getUserById,
  getAllUsers,
  updateUserAssociation
}