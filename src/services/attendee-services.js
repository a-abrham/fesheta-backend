const db = require('../config/dbconfig')
const axios = require("axios").default
const qr = require('qr-image')

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
        let [price] = await db.query('SELECT price FROM ticket_types WHERE ticket_type_id = ?', [ticket_type_id])
        price = price[0].price

        let [attendee] = await db.query('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id])
        const name = attendee[0].attendee_name

        return {price, name}
    } catch (error) {
        console.error('Error purchasing ticket:', error)
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
        Authorization: `Bearer ${process.env.CHAPA_AUTH}`
    }
}

exports.initiatePayment = async (TEXT_REF, RETURN_URL, name, price) => {
    const CHAPA_URL = process.env.CHAPA_URL

    try {
        const data = {
            amount: `${price}`,
            currency: 'ETB',
            first_name: name,
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

exports.ticketAsPaid = async (id) => {
    try{
        const [result] = await db.query(
            'UPDATE tickets SET is_paid = 1 WHERE ticket_id = ?',
            [id]
        )

        const [ticket] = await db.query(
            'SELECT event_id, ticket_type_id FROM tickets WHERE ticket_id = ?',
            [id]
        )

        const [existingSale] = await db.query(
            'SELECT * FROM ticket_sales WHERE event_id = ? AND ticket_type_id = ?',
            [ticket[0].event_id, ticket[0].ticket_type_id]
        )

        if (existingSale.length === 0) {
            await db.query(
                'INSERT INTO ticket_sales (event_id, ticket_type_id, quantity_sold, total_amount_sold) VALUES (?, ?, 1, (SELECT price FROM ticket_types WHERE ticket_type_id = ?))',
                [ticket[0].event_id, ticket[0].ticket_type_id, ticket[0].ticket_type_id]
            )
        } else {
            await db.query(
                'UPDATE ticket_sales SET quantity_sold = quantity_sold + 1, total_amount_sold = total_amount_sold + (SELECT price FROM ticket_types WHERE ticket_type_id = ?) WHERE event_id = ? AND ticket_type_id = ?',
                [ticket[0].ticket_type_id, ticket[0].event_id, ticket[0].ticket_type_id]
            )
        }
        return true
    }catch(error){
        throw new Error(error.message)
    }
}

exports.getTicketDetails = async (id) => {
    try {
        const [data] = await db.query(`
            SELECT 
            tt.ticket_type_name,
            e.title,
            t.attendee_name,
            t.is_paid
        FROM 
            tickets t
        JOIN 
            ticket_types tt ON t.ticket_type_id = tt.ticket_type_id
        JOIN 
            events e ON t.event_id = e.event_id
        WHERE 
            t.ticket_id = ?`, [id])

        return data[0]

    } catch(error){
        throw new Error(error.message)
    }

}

exports.createQrCode = async (data) => {
    try {
        const qr_svg = qr.imageSync(data, { type: 'svg' })

        const dataURI = 'data:image/svg+xml,' + encodeURIComponent(qr_svg)

        return dataURI
    } catch (error) {
        throw new Error(error.message)
    }
}

exports.markTicketAsUsed = async (ticketId) => {
    try {
        const [result] = await db.query(
            'UPDATE tickets SET is_used = 1 WHERE ticket_id = ?',
            [ticketId]
        )

        if (result.affectedRows > 0) {
            return true
        } else {
            return false
        }
    } catch (error) {
        throw new Error(error.message)
    }
}

exports.isTicketUsed = async (ticketId) => {
    try {
        const [result] = await db.query(
            'SELECT is_used FROM tickets WHERE ticket_id = ?',
            [ticketId]
        )

        if (result.length > 0) {
            return result[0].is_used === 1
        } else {
            return false
        }
    } catch (error) {
        throw new Error(error.message)
    }
}