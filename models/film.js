const { DataTypes } = require('sequelize')
const sequelize = require('../util/database.js')

const Film = sequelize.define('film', {
	image: {
		type: DataTypes.STRING
	},
	title: {
		type: DataTypes.STRING
	},
	date: {
		type: DataTypes.DATE
	},
	rating: {
		type: DataTypes.REAL
	},
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		allowNull: false,
		unique: true,
		primaryKey: true
	}
})

module.exports = Film
