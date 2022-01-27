const { DataTypes } = require('sequelize')
const sequelize = require('../util/database.js')
const bcrypt = require('bcrypt')
const sendEmail = require('../util/sendEmail')
const fromEmail = require('../constants/constants')

const User = sequelize.define(
	'user',
	{
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [ 6, 40 ]
			}
		},
		uuid: {
			// It exists in order to be used in the token creation process, instead of "id", hardening the tokens.
			type: DataTypes.STRING,
			allowNull: false,
			unique: true
		},
		id: {
			// It exists in order to make faster queries in the future
			type: DataTypes.INTEGER,
			autoIncrement: true,
			allowNull: false,
			unique: true,
			primaryKey: true
		}
	},
	{
		hooks: {
			beforeSave: async (user, options) => {
				// Hashing the passwords before storing in db
				const salt = await bcrypt.genSalt()
				user.password = await bcrypt.hash(user.password, salt)
			},
			afterSave: async (user, options) => {
				try {
					// Welcoming email
					const to = user.email
					const from = fromEmail
					const subject = 'Welcome to the API'
					const text = 'Welcome to the best Disney data API'
					const html = '<h1>Welcome to the best Disney API!</h1>'

					await sendEmail(to, from, subject, text, html)
				} catch (error) {
					throw Error(error)
				}
			}
		}
	}
)

// Static method to make easier the login process
User.login = async (email, password) => {
	const user = await User.findOne({ where: { email: email } })
	if (user) {
		const auth = await bcrypt.compare(password, user.password)
		if (auth) {
			return user
		}
		throw Error('Incorrect password')
	}
	throw Error('Incorrect email')
}

module.exports = User