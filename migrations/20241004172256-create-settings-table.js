'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      tws_franchisee: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tws_franchisee', // Ensure this matches the table name for TWSFranchisee
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      zips: {
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      projectTypes: {
        type: Sequelize.STRING(1024),
        allowNull: true
      },
      buildingUses: {
        type: Sequelize.STRING(1024),
        allowNull: true
      }
    }, {
      timestamps: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci'
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('settings');
  }
};
