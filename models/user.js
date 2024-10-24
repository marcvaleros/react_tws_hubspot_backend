'use strict';

module.exports = (sequelize, DataTypes) => {
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
        model: 'twsfranchisees',
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
  }, {
    tableName: 'users',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci'
  });

  User.associate = function(models) {
    User.belongsTo(models.TWSFranchisee, { foreignKey: 'assoc_tws', as:'franchisee' });
    User.hasOne(models.RingCentral, { foreignKey: 'user_creds', as: 'ringcentral_creds', onDelete: 'SET NULL' });
  }

  return User;
}