const Character = require('../models/character')
const Film = require('../models/film')
const aws = require('aws-sdk')
const { accessKeyId, secretAccessKey } = require('../auth/secrets')
const { query } = require('express')

const listCharacters = async (req, res) => {
	try {
		let limit = 100
		let offset = 0

		if (req.body.limit) {
			limit = req.body.limit
		}
		if (req.body.offset) {
			offset = req.body.offset
		}

		const charactersList = await Character.findAll({
			attributes: [ 'image', 'name' ],
			limit,
			offset
		})
		res.json(charactersList)
	} catch (error) {
		res.staus(400).json({
			error: 'An error occurred'
		})
	}
}

const detailCharacter = async (req, res) => {
	try {
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id to detail.'
			})
			return
		}

		const idCharacter = req.body.id
		const characterDetails = await Character.findByPk(idCharacter)

		if (!characterDetails) {
			res.status(400).json({
				error: 'No character with that primary key'
			})
			return
		}

		res.json(characterDetails)
	} catch (error) {
		res.staus(400).json({
			error: 'An error occurred'
		})
	}
}

const searchCharacters = async (req, res) => {
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
		const mySearch = { where: mainQueryObject }

		if (movie) {
			mySearch.include = [ { model: Film, where: { id: movie } } ]
		}

		const result = await Character.findAll(mySearch)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: 'An error occurred'
		})
	}
}

const createCharacter = async (req, res) => {
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

		const result = await Character.create(req.body)
		res.json({
			message: 'Character created successfully',
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

const deleteCharacter = async (req, res) => {
	try {
		if (!req.body.id) {
			res.status(400).json({
				error: 'No id provided: You need to provide an id to delete.'
			})
			return
		}

		const oldCharacter = await Character.findByPk(req.body.id)

		if (!oldCharacter) {
			res.status(400).json({
				error: 'The id provided does not exist in the database'
			})
			return
		}

		if (oldCharacter.image) {
			const oldKey = oldCharacter.image.slice(-36)

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

		const result = await Character.destroy({
			where: {
				id: req.body.id
			}
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const updateCharacter = async (req, res) => {
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

		const oldCharacter = await Character.findByPk(req.body.id)

		if (!oldCharacter) {
			res.status(400).json({
				error: 'The id provided does not exist in the database'
			})
			return
		}

		if (req.file) {
			req.body.image = req.file.location

			if (oldCharacter.image) {
				const oldKey = oldCharacter.image.slice(-36)

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

		const result = await Character.update(req.body, {
			where: {
				id: req.body.id
			}
		})

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const createCharacterWithFilm = async (req, res) => {
	try {
		const result = await Character.create(req.body, {
			include: 'films'
		})
		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const addFilmToCharacter = async (req, res) => {
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

		const result = await characterToAssociate.addFilm(filmToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

const removeFilmtoCharacter = async (req, res) => {
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

		const result = await characterToAssociate.removeFilm(filmToAssociate)

		res.json(result)
	} catch (error) {
		res.status(400).json({
			error: error
		})
	}
}

module.exports = {
	listCharacters,
	detailCharacter,
	searchCharacters,
	createCharacter,
	deleteCharacter,
	updateCharacter,
	createCharacterWithFilm,
	addFilmToCharacter,
	removeFilmtoCharacter
}
