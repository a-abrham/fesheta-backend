const express = require('express')
const router = express.Router()
const organizerController = require('../controllers/organizer-controller')
const { verifyToken } = require('../middleware/auth-middleware')

router.post('/register', organizerController.addOrganizer)
router.post('/signin', organizerController.authenticateOrganizer)
router.get('/getSalesDetail/:eventId',  organizerController.getSalesDetails)

module.exports = router