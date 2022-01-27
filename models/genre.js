const { DataTypes } = require('sequelize')
const sequelize = require('../util/database.js')

const Genre = sequelize.define('genre', {
	image: {
		type: DataTypes.STRING
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		allowNull: false,
		unique: true,
		primaryKey: true
	}
})

module.exports = Genre
