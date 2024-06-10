const eventService = require('../services/event-services');

async function getEvents(req, res) {
    try {
        const events = await eventService.getAllEvents();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getEvents
};
