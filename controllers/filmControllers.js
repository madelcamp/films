const Film = require('../models/film')
const Character = require('../models/character')
const Genre = require('../models/genre')
const sequelize = require('../util/database')
const aws = require('aws-sdk')
const { accessKeyId, secretAccessKey } = require('../auth/secrets')

const listFilms = async (req, res) => {
	try {
		let limit = 100
		let offset = 0

		if (req.body.limit) {
			limit = req.body.limit
		}
		if (req.body.offset) {
			offset = req.body.offset
		}

		const filmList = await Film.findAll({
			attributes: [ 'image', 'title', 'date' ],
			limit,
			offset
		})
		res.json(filmList)
	} catch (error) {
		res.staus(400).json({ error: 'An error occurred' })
	}
}

const detailFilm = async (req, res) => {
	try {
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id to detail.'
			})
			return
		}

		const filmId = req.body.id
		const filmDetails = await Film.findByPk(filmId)

		if (!filmDetails) {
			res.status(400).json({ error: 'No movie with that primary key' })
			return
		}

		res.json(filmDetails)
	} catch (error) {
		res.status(400).json({ error: 'An error occurred' })
	}
}

const searchFilms = async (req, res) => {
	try {
		const isEmpty = Object.keys(req.query).length === 0

		if (isEmpty) {
			res.status(400).json({
				error: 'No query provided: You need to provide a query to query.'
			})
			return
		}

		// Getting the query object without the film
		const { genre, order, ...mainQueryObject } = req.query
		const mySearch = { where: mainQueryObject }

		console.log(order)

		if (order === 'ASC' || order === 'DESC') {
			mySearch.order = [ [ 'title', order ] ]
		}

		if (genre) {
			mySearch.include = [ { model: Genre, where: { id: genre } } ]
		}

		const result = await Film.findAll(mySearch)

		res.json(result)
	} catch (error) {
		console.log(error)
		res.status(400).json({
			error: 'An error occurred'
		})
	}
}

const createFilms = async (req, res) => {
	try {
		if (req.body.wrongExtension) {
			res.status(400).json({
				error: 'Wrong file extension: Only jpg or png extensions are allowed.'
			})
			return
		}

		if (req.file) {
			req.body.image = req.file.location
		}

		const result = await Film.create(req.body)
		res.json({
			message: 'Films created successfully',
			result
		})
	} catch (error) {
		if ('parent' in error && 'detail' in error.parent) {
			res.status(400).json({ error: error.parent.detail })
		} else {
			res.status(400).json({ error: error })
		}
	}
}

const deleteFilm = async (req, res) => {
	try {
		// No id provided, no deleting business
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id to delete.'
			})
			return
		}

		// If the id provided isn't in the DB, no deleting business
		const oldFilm = await Film.findByPk(req.body.id)

		if (!oldFilm) {
			res.status(400).json({
				error: 'The id provided does not exist in the database'
			})
			return
		}

		// if there is an old image in S3, we have to delete it
		if (oldFilm.image) {
			const oldKey = oldFilm.image.slice(-36)

			const s3 = new aws.S3({
				accessKeyId,
				secretAccessKey
			})

			s3.deleteObject(
				{
					Bucket: 'mySecretBucket',
					Key: oldKey
				},
				(err, data) => {}
			)
		}

		// Here we actually delete the record from the DB
		const result = await Film.destroy({
			where: {
				id: req.body.id
			}
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const updateFilm = async (req, res) => {
	try {
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id for an update.'
			})
			return
		}

		if (req.body.wrongExtension) {
			res.status(400).json({
				error: 'Wrong file extension: Only jpg or png extensions are allowed.'
			})
			return
		}

		const oldFilm = await Film.findByPk(req.body.id)

		if (!oldFilm) {
			res.status(400).json({
				error: 'The id provided does not exist in the database'
			})
			return
		}

		if (req.file) {
			req.body.image = req.file.location

			if (oldFilm.image) {
				const oldKey = oldFilm.image.slice(-36)

				const s3 = new aws.S3({
					accessKeyId,
					secretAccessKey
				})

				s3.deleteObject(
					{
						Bucket: 'mySecretBucket',
						Key: oldKey
					},
					(err, data) => {}
				)
			}
		}

		const result = await Film.update(req.body, {
			where: {
				id: req.body.id
			}
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const createFilmWithCharacter = async (req, res) => {
	try {
		const result = await Film.create(req.body, { include: 'characters' })
		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const addCharacterToFilm = async (req, res) => {
	try {
		if (!req.body.characterId || !req.body.filmId) {
			res.status(400).json({
				error: 'No ids provided: You need to provide an characterId and filmId to add an association'
			})
			return
		}

		const { characterId, filmId } = req.body
		const [ characterToAssociate, filmToAssociate ] = await Promise.all([
			Character.findByPk(characterId),
			Film.findByPk(filmId)
		])

		if (!characterToAssociate || !filmToAssociate) {
			res.status(400).json({
				error: 'id(s) not found: characterId and filmId need to exist in the Database'
			})
			return
		}

		const result = await filmToAssociate.addCharacter(characterToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const removeCharacterToFilm = async (req, res) => {
	try {
		if (!req.body.characterId || !req.body.filmId) {
			res.status(400).json({
				error: 'No ids provided: You need to provide an characterId and filmId to add an association'
			})
			return
		}

		const { characterId, filmId } = req.body
		const [ characterToAssociate, filmToAssociate ] = await Promise.all([
			Character.findByPk(characterId),
			Film.findByPk(filmId)
		])

		if (!characterToAssociate || !filmToAssociate) {
			res.status(400).json({
				error: 'id(s) not found: characterId and filmId need to exist in the Database'
			})
			return
		}

		const result = await filmToAssociate.removeCharacter(characterToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const createFilmWithGenre = async (req, res) => {
	try {
		const result = await Film.create(req.body, { include: 'genres' })
		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const addGenreToFilm = async (req, res) => {
	try {
		if (!req.body.genreId || !req.body.filmId) {
			res.status(400).json({
				error: 'No ids provided: You need to provide an genreId and filmId to add an association'
			})
			return
		}

		const { genreId, filmId } = req.body
		const [ genreToAssociate, filmToAssociate ] = await Promise.all([
			Genre.findByPk(genreId),
			Film.findByPk(filmId)
		])

		if (!genreToAssociate || !filmToAssociate) {
			res.status(400).json({
				error: 'id(s) not found: genreId and filmId need to exist in the Database'
			})
			return
		}

		const result = await filmToAssociate.addGenre(genreToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const removeGenreToFilm = async (req, res) => {
	try {
		if (!req.body.genreId || !req.body.filmId) {
			res.status(400).json({
				error: 'No ids provided: You need to provide an genreId and filmId to add an association'
			})
			return
		}

		const { genreId, filmId } = req.body
		const [ genreToAssociate, filmToAssociate ] = await Promise.all([
			Genre.findByPk(genreId),
			Film.findByPk(filmId)
		])

		if (!genreToAssociate || !filmToAssociate) {
			res.status(400).json({
				error: 'id(s) not found: genreId and filmId need to exist in the Database'
			})
			return
		}

		const result = await filmToAssociate.removeGenre(genreToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

module.exports = {
	listFilms,
	detailFilm,
	searchFilms,
	createFilms,
	deleteFilm,
	updateFilm,
	createFilmWithCharacter,
	addCharacterToFilm,
	removeCharacterToFilm,
	createFilmWithGenre,
	addGenreToFilm,
	removeGenreToFilm
}
