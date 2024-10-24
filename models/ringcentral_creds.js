'use strict';

module.exports = (sequelize, DataTypes) => {
  const RingCentral = sequelize.define('RingcentralCreds', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    user_creds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true, 
    },
    jwt: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    extensionID: {
      type: DataTypes.STRING(255),
      allowNull: true,
    }
  }, {
    tableName: 'ringcentral_credentials',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci'
  });

  RingCentral.associate = function(models) {
    RingCentral.belongsTo(models.User, { foreignKey: 'user_creds', as:'ringcentral_creds' });
  }

  return RingCentral;
}