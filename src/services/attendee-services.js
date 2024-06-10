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


exports.purchase = async() => {
    const CHAPA_URL = process.env.CHAPA_URL || "https://api.chapa.co/v1/transaction/initialize"
    const CHAPA_AUTH = "CHASECK_TEST-lqfq5yTuTQt1Wtj2gISJ4wmVs8jI220K" 

    const CALLBACK_URL = "http://localhost:4400/api/verify-payment/"
    const RETURN_URL = "http://localhost:4400/api/payment-success/"

    const TEXT_REF = "tx-feshta-" + Date.now()
    const data = {
            amount: '100', 
            currency: 'ETB',
            email: 'ato@ekele.com',
            first_name: 'Ato',
            last_name: 'Ekele',
            tx_ref: TEXT_REF,
            callback_url: CALLBACK_URL + TEXT_REF,
            return_url: RETURN_URL
        }

        await axios.post(CHAPA_URL, data, config)
            .then((response) => {
                res.redirect(response.data.data.checkout_url)
            })
            .catch((err) => console.log(err))
}


