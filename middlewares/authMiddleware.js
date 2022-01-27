const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { secretJWT } = require('../auth/secrets')

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt

    // Check json web token exists & is verified
    if (token) {
        jwt.verify(token, secretJWT, (err, decodedToken) => {
            if (err) {
                console.log(err.message)
                res.status(403).json({ error: 'An error occurred' })
            } else {
                next()
            }
        })
    } else {
        res.status(400).json({ error: 'No token provided' })
    }
}

module.exports = requireAuth