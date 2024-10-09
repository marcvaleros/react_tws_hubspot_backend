'use strict';

module.exports = (sequelize, DataTypes) => {
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
    owner: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    hubspot_api_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'tws_franchisee',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci'
  });

  TWSFranchisee.associate = function (models) {
    TWSFranchisee.hasMany(models.User, { foreignKey: 'assoc_tws', as: 'users' });
    TWSFranchisee.hasOne(models.Setting, { foreignKey: 'tws_franchisee', as: 'settings', onDelete: 'SET NULL' });
  }

  return TWSFranchisee;
}