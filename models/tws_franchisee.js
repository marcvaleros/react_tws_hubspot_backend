const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User  = require('./user');
const Setting  = require('./setting');

const TWSFranchisee = sequelize.define('TWSFranchisee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  hubspot_api_key: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tws_franchisee',
  timestamps: true,
});

//setup associations here

TWSFranchisee.hasMany(User, {
  foreignKey: 'assoc_tws',
  as: 'users',
})

TWSFranchisee.hasOne(Setting, {
  foreignKey: '',
  as: 'setting_fk',
  onDelete: 'CASCADE'
})


module.exports = TWSFranchisee;