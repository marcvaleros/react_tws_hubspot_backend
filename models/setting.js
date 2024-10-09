'use strict'

module.exports = (sequelize, DataTypes) => {
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
        model: 'twsfranchisees',
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

  Setting.associate = (models) => {
    Setting.belongsTo(models.TWSFranchisee, { foreignKey: 'tws_franchisee', as: 'franchisee' });
  }

  return Setting;
}
