'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('ringcentral_credentials', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true, 
        allowNull: false,
      },
      user_creds: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      jwt: {
        type: Sequelize.STRING(1024),
        allowNull: true,
      },
      extensionID: {
        type: Sequelize.STRING(255),
        defaultValue: null,
        allowNull: true
      }
   }, {
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci'
  })
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('ringcentral_credentials');
  }
};
