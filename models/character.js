const { DataTypes } = require('sequelize')
const sequelize = require('../util/database.js')

const Character = sequelize.define('character', {
	image: {
		type: DataTypes.STRING
	},
	name: {
		type: DataTypes.STRING
	},
	age: {
		type: DataTypes.INTEGER
	},
	weight: {
		type: DataTypes.INTEGER
	},
	history: {
		type: DataTypes.STRING
	},
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		allowNull: false,
		unique: true,
		primaryKey: true
	}
})

module.exports = Character
