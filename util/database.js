const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('disney-challenge', 'postgres', 'mySecretPassword', {
    host: 'localhost',
    dialect: 'postgres'

    //,logging: false
  });

module.exports = sequelize