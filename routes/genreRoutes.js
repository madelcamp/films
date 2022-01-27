const { Router } = require('express')
const genreControllers = require('../controllers/genreControllers')
const upload = require('../services/uploadS3')

const router = Router()


router.get('/detail', genreControllers.detailGenre)
router.post('/crud/create', upload.single('picture'), genreControllers.createGenres)
router.post('/crud/delete', genreControllers.deleteGenre)
router.post('/crud/update', upload.single('picture'), genreControllers.updateGenre)
router.post('/crud/creategenrewithfilm', genreControllers.createGenreWithFilm)
router.post('/crud/addfilmtogenre', genreControllers.addFilmToGenre)
router.post('/crud/removefilmtogenre', genreControllers.removeFilmToGenre)
router.get('/search', genreControllers.searchGenre)
router.get('/', genreControllers.listGenres)

module.exports = router
