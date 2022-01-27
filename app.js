const express = require('express')
const path = require('path')
const sequelize = require('./util/database')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/authRoutes')
const characterRoutes = require('./routes/characterRoutes')
const filmRoutes = require('./routes/filmRoutes')
const genreRoutes = require('./routes/genreRoutes')
const requireAuth = require('./middlewares/authMiddleware')
const Character = require('./models/character')
const Film = require('./models/film')
const Genre = require('./models/genre')
const User = require('./models/user')
const errorHandler = require('./services/errorHandler')

const app = express()

// Initial Middlewares
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(express.json()) // parses json to js objects, used as req.body
app.use(cookieParser()) // so that we can use req.cookies

// Routes
app.use('/auth', authRoutes)
app.use('/characters', requireAuth, characterRoutes)
app.use('/movies', requireAuth, filmRoutes)
app.use('/genres', requireAuth, genreRoutes)
app.use('/', (req, res) => {
	res.render('index')
})
app.use(errorHandler)

// Associations
Character.belongsToMany(Film, { through: 'characterfilm' })
Film.belongsToMany(Character, { through: 'characterfilm' })

Film.belongsToMany(Genre, { through: 'filmgenre' })
Genre.belongsToMany(Film, { through: 'filmgenre' })

// Starting API
const initializer = async () => {
	// Syncing Database
	const result = await sequelize.sync() // {alter: true} {force: true}
	//console.log(result)
	// Listening
	app.listen(5000)
	console.log('Listening') 
}

initializer()