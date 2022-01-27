const { Router } = require('express')
const filmControllers = require('../controllers/filmControllers')
const upload = require('../services/uploadS3')

const router = Router()

router.get('/detail', filmControllers.detailFilm)
router.post('/crud/create', upload.single('picture'), filmControllers.createFilms)
router.post('/crud/delete', filmControllers.deleteFilm)
router.post('/crud/update', upload.single('picture'), filmControllers.updateFilm)
router.post('/crud/createfilmwithchar', filmControllers.createFilmWithCharacter)
router.post('/crud/addchartofilm', filmControllers.addCharacterToFilm)
router.post('/crud/removechartofilm', filmControllers.removeCharacterToFilm)
router.post('/crud/createfilmwithgenre', filmControllers.createFilmWithGenre)
router.post('/crud/addgenretofilm', filmControllers.addGenreToFilm)
router.post('/crud/removegenretofilm', filmControllers.removeGenreToFilm)
router.get('/search', filmControllers.searchFilms)
router.get('/', filmControllers.listFilms)

module.exports = router
