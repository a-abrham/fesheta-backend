const eventService = require('../services/event-services')

exports.addEvent = async (req, res) => {
    try {
        await eventService.addEvent(req.body)
        res.json({ success: true, message: 'Event added successfully'})
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add event', error: error.message })
    }
}

exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents()
        res.json(events[0])
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message })
    }
}

exports.updateEvent = async (req, res) => {
    try {
        const result = await eventService.updateEvent(req.body)
        res.json({ success: true, message: 'Event updated successfully'})
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update event', error: error.message })
    }
}

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id
        const result = await eventService.deleteEvent(eventId)
        res.json({ success: true, message: 'Event deleted successfully'})
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message })
    }
}
