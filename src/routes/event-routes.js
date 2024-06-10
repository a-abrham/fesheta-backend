const express = require('express')
const router = express.Router()
const eventController = require('../controllers/event-controller')

router.get('/events', eventController.getAllEvents)
router.post('/events', eventController.addEvent)
router.put('/events', eventController.updateEvent)
router.delete('/events/:id', eventController.deleteEvent)

module.exports = router