const db = require('../config/dbconfig')
const axios = require("axios").default


exports.createTicket = async (ticketData) => {
        const {eventId, ticketTypeId, purchaseDate, attendeeName, attendeeEmail, attendeePhone} = ticketData
        try {
            await db.query(`
            INSERT INTO tickets (event_id, ticket_type_id, purchase_date, attendee_name, attendee_email, attendee_phone)
            VALUES (?, ?, ?, ?, ?, ?)`, [eventId, ticketTypeId, purchaseDate, attendeeName, attendeeEmail, attendeePhone])
            return {success: true}
        } catch (error) {
            console.error('Error creating ticket:', error)
            throw error
        }
}

   
exports.deleteTicket = async (ticketId) => {
    try {
        const query = 'DELETE FROM tickets WHERE ticket_id = ?'
        await db.query(query, [ticketId])
    } catch (error) {
        console.error('Error deleting ticket:', error)
        throw error
    }
}

const config = {
    headers: {
        Authorization: `Bearer ${process.env.CHAPA_AUTH || "CHASECK_TEST-lqfq5yTuTQt1Wtj2gISJ4wmVs8jI220K"}`
    }
}

exports.initiatePayment = async (TEXT_REF, RETURN_URL) => {
    const CHAPA_URL = process.env.CHAPA_URL || "https://api.chapa.co/v1/transaction/initialize"

    try {
        const data = {
            amount: '100',
            currency: 'ETB',
            email: 'ato@ekele.com',
            first_name: 'Ato',
            last_name: 'Ekele',
            tx_ref: TEXT_REF,
            return_url: RETURN_URL
        }

        const response = await axios.post(CHAPA_URL, data, config)
        return response.data.data.checkout_url
    } catch (error) {
        throw new Error(error.message)
    }
}

exports.verifyPayment = async (id) => {
    try {
        const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${id}`, config)
        return true
    } catch (error) {
        throw new Error(error.message)
    }
}