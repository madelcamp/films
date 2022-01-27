const { Router } = require('express')
const characterControllers = require('../controllers/characterControllers')
const upload = require('../services/uploadS3')

const router = Router()

router.get('/detail', characterControllers.detailCharacter)
router.post('/crud/create', upload.single('picture'), characterControllers.createCharacter)
router.post('/crud/delete', characterControllers.deleteCharacter)
router.post('/crud/update', upload.single('picture'), characterControllers.updateCharacter)
router.post('/crud/createcharwithfilm', characterControllers.createCharacterWithFilm)
router.post('/crud/addfilmtochar', characterControllers.addFilmToCharacter)
router.post('/crud/removefilmtochar', characterControllers.removeFilmtoCharacter)
router.get('/search', characterControllers.searchCharacters)
router.get('/', characterControllers.listCharacters)

module.exports = router
