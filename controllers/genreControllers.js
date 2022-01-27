const Film = require('../models/film')
const Genre = require('../models/genre')
const aws = require('aws-sdk')
const { accessKeyId, secretAccessKey } = require('../auth/secrets')

const listGenres = async (req, res) => {
	try {
		let limit = 100
		let offset = 0

		if (req.body.limit) {
			limit = req.body.limit
		}
		if (req.body.offset) {
			offset = req.body.offset
		}

		const genreList = await Genre.findAll({
			attributes: [ 'name', 'image', 'id' ],
			limit,
			offset
		})
		res.json(genreList)
	} catch (error) {
		res.staus(400).json({ error: 'An error occurred' })
	}
}

const detailGenre = async (req, res) => {
	try {
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id to detail.'
			})
			return
		}

		const idGenre = req.body.id
		const genreDetails = await Character.findByPk(idGenre)

		if (!genreDetails) {
			res.status(400).json({
				error: 'No character with that primary key'
			})
			return
		}

		res.json(genreDetails)
	} catch (error) {
		res.status(400).json({ error: 'An error occurred' })
	}
}

const searchGenre = async (req, res) => {
	try {
		const isEmpty = Object.keys(req.query).length === 0

		if (isEmpty) {
			res.status(400).json({
				error: 'No query provided: You need to provide a query to query.'
			})
			return
		}

		// Getting the query object without the film
		const { movie, ...mainQueryObject } = req.query

		if (movie) {
			const result = await Genre.findAll({
				where: mainQueryObject,
				include: [
					{
						model: Film,
						where: { id: movie }
					}
				]
			})

			res.json(result)
			return
		}

		const result = await Genre.findAll({
			where: mainQueryObject
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: 'An error occurred'
		})
	}
}

const createGenres = async (req, res) => {
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

		const result = await Genre.create(req.body)
		res.json({
			message: 'Genre created successfully',
			result
		})
	} catch (error) {
		if ('parent' in error && 'detail' in error.parent) {
			res.status(400).json({ error: error.parent.detail })
		} else if ('errors' in error && Array.isArray(error.errors) && 'message' in error.errors[0]) {
			res.status(400).json({ error: error.errors[0].message })
		} else {
			res.status(400).json({ error: error })
		}
	}
}

const deleteGenre = async (req, res) => {
	try {
		// No id provided, no deleting business
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id to delete.'
			})
			return
		}

		// If the id provided isn't in the DB, no deleting business
		const oldGenre = await Genre.findByPk(req.body.id)

		if (!oldGenre) {
			res.status(400).json({
				error: 'The id provided does not exist in the database'
			})
			return
		}

		// if there is an old image in S3, we have to delete it
		if (oldGenre.image) {
			const oldKey = oldGenre.image.slice(-36)

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
		const result = await Genre.destroy({
			where: {
				id: req.body.id
			}
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const updateGenre = async (req, res) => {
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

		const oldGenre = await Genre.findByPk(req.body.id)

		if (!oldGenre) {
			res.status(400).json({
				error: 'The id provided does not exist in the database'
			})
			return
		}

		if (req.file) {
			req.body.image = req.file.location

			if (oldGenre.image) {
				const oldKey = oldGenre.image.slice(-36)

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

		const result = await Genre.update(req.body, {
			where: {
				id: req.body.id
			}
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const createGenreWithFilm = async (req, res) => {
	try {
		const result = await Genre.create(req.body, { include: 'films' })
		res.json(result)
	} catch (error) {
		res.status(400).json({ error: error })
	}
}

const addFilmToGenre = async (req, res) => {
	try {
		if (!req.body.genreId || !req.body.filmId) {
			res.status(400).json({
				error: 'No ids provided: You need to provide an characterId and filmId to add an association'
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

		const result = await genreToAssociate.addFilm(filmToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const removeFilmToGenre = async (req, res) => {
	try {
		if (!req.body.genreId || !req.body.filmId) {
			res.status(400).json({
				error: 'No ids provided: You need to provide an characterId and filmId to add an association'
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

		const result = await genreToAssociate.removeFilm(filmToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

module.exports = {
	listGenres,
	detailGenre,
	searchGenre,
	createGenres,
	deleteGenre,
	updateGenre,
	createGenreWithFilm,
	addFilmToGenre,
	removeFilmToGenre
}
