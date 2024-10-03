require('dotenv').config();
const {Sequelize} = require('sequelize');

const sequelize = new Sequelize('zachomatic', 'root', 'admin', {
  host: 'localhost',
  dialect: 'mysql'
});

sequelize.authenticate()
.then(() => {
  console.log('Connected to MySQL with Sequelize');
  
   // Sync the models with the database
  return sequelize.sync({ alter: true });
})
.then(() => {
  console.log('Database synchronized successfully');
})
.catch((err) => console.log('Unable to connect to the database:', err));

module.exports = sequelize;

