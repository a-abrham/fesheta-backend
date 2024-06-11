const db = require('../config/dbconfig')
const axios = require("axios").default


exports.createTicket = async (ticketData) => {
        const {eventId, ticket_type_id, attendeeName} = ticketData
        try {
            const result = await db.query(`
            INSERT INTO tickets (event_id, ticket_type_id, attendee_name)
            VALUES (?, ?, ?)`, [eventId, ticket_type_id, attendeeName])
            const insertedId = result[0].insertId
            return {success: true, insertedId}
        } catch (error) {
            console.error('Error creating ticket:', error)
            throw error
        }
}

exports.purchaseTicket = async (ticket_type_id, ticket_id) => {
    try {
        let [price] = await db.query('SELECT price FROM ticket_types WHERE ticket_type_id = ?', [ticket_type_id]);
        price = price[0].price

        let [attendee] = await db.query('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id]);
        const name = attendee[0].attendee_name

        return {price, name}
    } catch (error) {
        console.error('Error purchasing ticket:', error);
        throw error;
    }
};
   
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
            first_name: 'Ato',
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