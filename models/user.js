const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const TWSFranchisee = require('./tws_franchisee');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
  },
  assoc_tws: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: TWSFranchisee,
      key: 'id',
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'agent'),
    allowNull:true
  },
  magicLinkToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  magicLinkExpires: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'users',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_0900_ai_ci'
});

module.exports = User;