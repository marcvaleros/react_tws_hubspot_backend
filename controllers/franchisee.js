const {TWSFranchisee} = require("../models");

const getAllFranchisees = async (req,res) => {
  try {
    const franchisees = await TWSFranchisee.findAll();
    if(!franchisees) return res.sendStatus(404);

    res.json(franchisees);

  } catch (error) {
    console.error('Error Fetching Franchisees:', error);
    res.sendStatus(500);
  }
}

module.exports = {
  getAllFranchisees
}