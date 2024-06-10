const db = require('../config/dbconfig')

exports.getAllEvents = async () => {
    try {
        const results = await db.query('SELECT * FROM events')
        return results
    } catch (error) {
        console.error('Error fetching events:', error)
        throw error
    }
}

exports.addEvent = async (eventData) => {
    const { title, description, date, venue, organizer_id } = eventData
    try {
        const results = await db.query('INSERT INTO events (title, description, date, venue, organizer_id) VALUES (?, ?, ?, ?, ?)', [title, description, date, venue, organizer_id])
        console.log('Event added successfully')
        return results
    } catch (error) {
        console.error('Error adding event:', error)
        throw error
    }
}

exports.updateEvent = async (eventData) => {
    const { title, description, date, venue, organizer_id, event_id} = eventData
    try {
        const results = await db.query('UPDATE events SET title=?, description=?, date=?, venue=?, organizer_id=? WHERE event_id=?', [title, description, date, venue, organizer_id, event_id])
        console.log('Event updated successfully')
        return results
    } catch (error) {
        console.error('Error updating event:', error)
        throw error
    }
}

exports.deleteEvent = async (eventId) => {
    try {
        const results = await db.query('DELETE FROM events WHERE event_id=?', [eventId])
        console.log('Event deleted successfully')
        return results
    } catch (error) {
        console.error('Error deleting event:', error)
        throw error
    }
}

exports.createTicketType = async (typeData) => {
    const {eventId, typeName, price} = typeData
    try {
        const query = `
            INSERT INTO ticket_types (event_id, ticket_type_name, price)
            VALUES (?, ?, ?)
        `
        const result = await db.query(query, [eventId, typeName, price]) 
        return {success: true}

    } catch (error) {
        console.error('Error creating ticket type:', error)
        throw error
    }
}