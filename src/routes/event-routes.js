const express = require('express')
const router = express.Router()
const eventController = require('../controllers/event-controller')

router.post('/events', eventController.addEvent)
router.get('/events', eventController.getAllEvents)
router.put('/events', eventController.updateEvent)
router.delete('/events/:id', eventController.deleteEvent)

router.post('/events/type', eventController.createTicketType)

module.exports = router