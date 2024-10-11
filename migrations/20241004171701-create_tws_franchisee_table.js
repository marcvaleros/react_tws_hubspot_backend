'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tws_franchisee', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      owner: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      hubspot_api_key: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      timestamps: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci'
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('tws_franchisee')
  }
};
