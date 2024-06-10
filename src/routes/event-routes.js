const express = require('express')
const router = express.Router()
const eventController = require('../controllers/event-controller')

router.get('/events', eventController.getEvents)
module.exports = router  