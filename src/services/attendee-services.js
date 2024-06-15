const db = require('../config/dbconfig')
const axios = require("axios").default
const qr = require('qr-image')

const transporter = require('../config/mailerconfig')

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: 'websiteemsa@gmail.com',
        to,
        subject,
        text
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log('Reminder email sent successfully')
        return true
    } catch (error) {
        console.error('Error sending email:', error)
        return false
    }
}

exports.createTicket = async (ticketData) => {
        const {eventId, ticket_type_id, attendee_name, attendee_email} = ticketData
        try {
            const result = await db.query(`
            INSERT INTO tickets (event_id, ticket_type_id, attendee_name, attendee_email)
            VALUES (?, ?, ?, ?)`, [eventId, ticket_type_id, attendee_name, attendee_email])
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


exports.scheduleReminderEmail = async (ticket_id) => {
    try {
        const [ticket] = await db.query(
            'SELECT event_id FROM tickets WHERE ticket_id = ?',
            [ticket_id]
        )

        if (ticket.length === 0) {
            throw new Error(`Ticket with ID ${ticket_id} not found`)
        }

        const eventId = ticket[0].event_id

        const [event] = await db.query(
            'SELECT date FROM events WHERE event_id = ?',
            [eventId]
        )

        if (event.length === 0) {
            throw new Error(`Event with ID ${eventId} not found`)
        }

        const eventDate = event[0].date

        let [attendee_email] = await db.query('SELECT attendee_email FROM tickets WHERE ticket_id = ?', [ticket_id])
        
        if(attendee_email.length === 0){
            throw new Error(`Email with Ticket ID ${ticket_id} not found`)
        }

        attendee_email = attendee_email[0].attendee_email

        const reminderDate = new Date(eventDate)
        reminderDate.setDate(reminderDate.getDate() - 2)

        const [existingReminder] = await db.query(
            'SELECT reminder_id, emails FROM reminders WHERE event_id = ?',
            [eventId]
        )

        if (existingReminder.length > 0) {
            const reminder = existingReminder[0]
            const emails = reminder.emails

            emails.push(attendee_email)

            await db.query(
                'UPDATE reminders SET emails = ? WHERE reminder_id = ?',
                [JSON.stringify(emails), reminder.reminder_id]
            )
        } else {
            await db.query(
                'INSERT INTO reminders (event_id, emails, send_date) VALUES (?, ?, ?, ?)',
                [eventId, JSON.stringify([attendee_email]), reminderDate]
            )
        }

    } catch (error) {
        console.error(`Failed to schedule reminder email: ${error.message}`)
        throw error
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

        await scheduleReminderEmail(id)

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

exports.getAllReminders = async () => {
    try {
        const [reminders] = await db.query('SELECT * FROM reminders')

        return reminders
    } catch (error) {
        console.error(`Error retrieving reminders: ${error.message}`)
        throw error
    }
}




exports.sendReminderEmails = async (reminder_id) => {
    try {
        const [reminder] = await db.query('SELECT emails FROM reminders WHERE reminder_id = ?', [reminder_id])

        if (!reminder || reminder.length === 0) {
            throw new Error(`Reminder with ID ${reminder_id} not found`)
        }

        let emails = reminder[0].emails

        for (const email of emails) {
            const [rows] = await db.query(`
            SELECT t.attendee_name, e.title as event_title, e.date as event_date, e.venue as event_venue
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.event_id
            WHERE t.attendee_email = ?
            `, [email])
        
        if (rows.length > 0) {
            const attendeeName = rows[0].attendee_name
            const eventTitle = rows[0].event_title
            const eventDate = rows[0].event_date.toLocaleString()
            const eventVenue = rows[0].event_venue
        
            const subject = 'Your Event Reminder'
            const text = `Hi ${attendeeName},\n\n` +
                         `This is a reminder for your upcoming event:\n\n` +
                         `Event: ${eventTitle}\n` +
                         `Date: ${eventDate}\n` +
                         `Venue: ${eventVenue}\n\n` +
                         `Please be there on time!\n\n` +
                         `Best regards,\n` +
                         `Event Management Team`
        
            const is_sent = await sendEmail(email, subject, text)

            if(is_sent){
                emails = emails.filter(e => e !== email)
            }else{
                console.log('not sent', email)
            }
        }
    }

        await db.query(
            'UPDATE reminders SET emails = ? WHERE reminder_id = ?',
            [JSON.stringify(emails), reminder_id]
        )

    } catch (error) {
        console.error(`Failed to send reminder emails: ${error.message}`)
        throw error
    }
}