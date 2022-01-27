const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { secretJWT } = require('../auth/secrets')
const { v4: uuidv4 } = require('uuid')

// Handle errors
const handleErrors = (err) => {
	try {
		let errors = { email: '', password: '' }

		// Incorrect email
		if (err.message === 'Incorrect email') {
			errors.email = 'That email is not registered'
		}

		// Incorrect password
		if (err.message === 'Incorrect password') {
			errors.password = 'That password is incorrect'
		}

		// Duplicate error code
		const check = err.hasOwnProperty('parent') && err.parent.hasOwnProperty('code') && err.parent.code === '23505'
		if (check) {
			errors.email = 'That email is already registered'
			return errors
		}

		// Validation errors
		if (err.message.includes('Validation error')) {
			Object.values(err.errors).forEach(({ path, message }) => {
				errors[path] = message
			})
		}

		return errors
	} catch (error) {
		return 'Weird error occurred'
	}
}

const maxAge = 60 * 60 * 24 * 30 * 6 // 6 months, in seconds
const createToken = (uuid) => {
	return jwt.sign({ uuid }, secretJWT, { expiresIn: maxAge }) // (payload, secret, options)
}

const register = async (req, res) => {
	try {
		const { email, password } = req.body

		const user = await User.create({ email, password, uuid: uuidv4() })
		const token = createToken(user.uuid)
		res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
		res.json({ user: user.id })
	} catch (err) {
		const errors = handleErrors(err)
		res.status(400).json({ errors })
	}
}

const login = async (req, res) => {
	try {
		const { email, password } = req.body

		const user = await User.login(email, password)
		const token = createToken(user.uuid)
		res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
		res.json({ user: user.id })
	} catch (err) {
		const errors = handleErrors(err)
		res.status(400).json({ errors })
	}
}

module.exports = {
	register,
	login
}
