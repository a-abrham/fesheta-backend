const express = require('express')
const router = express.Router()
const organizerController = require('../controllers/organizer-controller')

router.post('/register', organizerController.addOrganizer)
router.post('/signin', organizerController.authenticateOrganizer)

module.exports = router  