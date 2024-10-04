const sequelize = require('../config/db');
const User = require('./user');
const TWSFranchisee = require('./tws_franchisee');
const Setting = require('./setting');


//model associations
TWSFranchisee.hasMany(User, { foreignKey: 'assoc_tws', as: 'users' });
TWSFranchisee.hasOne(Setting, { foreignKey: 'tws_franchisee', as: 'settings', onDelete: 'CASCADE' });
Setting.belongsTo(TWSFranchisee, { foreignKey: 'tws_franchisee', as: 'franchisee' });
User.belongsTo(TWSFranchisee, { foreignKey: 'assoc_tws', as:'franchisee' });

module.exports = {
  sequelize, 
  User,
  TWSFranchisee,
  Setting
}