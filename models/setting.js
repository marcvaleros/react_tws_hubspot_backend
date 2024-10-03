const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
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
});



module.exports = Setting;