const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const TWSFranchisee = require('./tws_franchisee');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  tws_franchisee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: TWSFranchisee,
      key: 'id'
    }
  },
  zips: {
    type: DataTypes.STRING(1024),
    allowNull: true,
  },
  projectTypes: {
    type: DataTypes.STRING(1024),
    allowNull: true,
  },
  buildingUses: {
    type: DataTypes.STRING(1024),
    allowNull: true,
  },
}, {
  tableName: 'settings',
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_0900_ai_ci'
});

module.exports = Setting;