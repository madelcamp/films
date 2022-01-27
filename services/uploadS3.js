const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const { accessKeyId, secretAccessKey } = require('../auth/secrets')
const { v4: uuidv4 } = require('uuid')
const Character = require('../models/character')
const Film = require('../models/film')
const Genre = require('../models/genre')

const s3 = new aws.S3({
	accessKeyId,
	secretAccessKey
})

const upload = multer({
	// Limitations to avoid bad use of cloud resorces.
	limits: {
		fileSize: 10485760,
		files: 1,
		parts: 6
	},
	fileFilter: async function fileFilter(req, file, cb) {
		// You need an id to update a file
		if (req.path === '/crud/update' && req.body.id === undefined) {
			cb(null, false)
			return
		}

		// No upload if the provided id doesn't exists in DB, when updating.
		if (req.path === '/crud/update' && req.body.id) {
			if (req.baseUrl === '/characters') {
				const oldCharacter = await Character.findByPk(req.body.id)

				if (!oldCharacter) {
					cb(null, false)
					return
				}
			} else if (req.baseUrl === '/movies') {
				const oldFilm = await Film.findByPk(req.body.id)

				if (!oldFilm) {
					cb(null, false)
					return
				}
			} else if (req.baseUrl === '/genres') {
				const oldGenre = await Genre.findByPk(req.body.id)

				if (!oldGenre) {
					cb(null, false)
					return
				}
			}
		}

		// No upload if the provided id already exists in DB, when creating
		if (req.path === '/crud/create' && req.body.id) {
			if (req.baseUrl === '/characters') {
				const oldCharacter = await Character.findByPk(req.body.id)

				if (oldCharacter) {
					cb(null, false)
					return
				}
			} else if (req.baseUrl === '/movies') {
				const oldFilm = await Film.findByPk(req.body.id)

				if (oldFilm) {
					cb(null, false)
					return
				}
			} else if (req.baseUrl === '/genres') {
				const oldGenre = await Genre.findByPk(req.body.id)

				if (oldGenre) {
					cb(null, false)
					return
				}

				console.log(req.body.name)

				if (!req.body.name) {
					cb(null, false)
					return
				} else {
					const oldGenre = await Genre.findOne({ where: { name: req.body.name } })
					if (oldGenre) {
						cb(null, false)
						return
					}
				}
			}
		}

		if (req.path === '/crud/create' && req.baseUrl === '/genres' && req.body.name === undefined) {
			cb(null, false)
			return
		}

		if (req.path === '/crud/create' && req.baseUrl === '/genres' && req.body.name !== undefined) {
			const oldGenre = await Genre.findOne({ where: { name: req.body.name } })
			if (oldGenre) {
				cb(null, false)
				return
			}
		}

		// Only upload of allowed extension files
		const allowedExtensions = [ 'image/jpeg', 'image/png' ]

		if (!allowedExtensions.includes(file.mimetype)) {
			req.body.wrongExtension = true
			cb(null, false)
			return
		}

		cb(null, true)
	},
	storage: multerS3({
		s3: s3,
		bucket: 'mySecretBucket',
		contentType: multerS3.AUTO_CONTENT_TYPE,
		metadata: function(req, file, cb) {
			cb(null, { fieldName: file.fieldname })
		},
		key: function(req, file, cb) {
			cb(null, uuidv4())
		}
	})
})

module.exports = upload
