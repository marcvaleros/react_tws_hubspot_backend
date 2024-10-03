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
  charset: 'utf8mb4',
  collate: 'utf8mb4_0900_ai_ci'
});

//setup associations here

TWSFranchisee.hasMany(User, {
  foreignKey: 'assoc_tws',
  as: 'user',
});

TWSFranchisee.hasOne(Setting, {
  foreignKey: '',
  as: 'setting',
  onDelete: 'CASCADE'
});


module.exports = TWSFranchisee;