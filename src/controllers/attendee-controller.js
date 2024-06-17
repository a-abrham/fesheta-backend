const service = require('../services/attendee-services')

const MAX_RETRIES = 5

exports.createTicketAndPay = async (req, res) => {
    try {
        const result = await service.createTicket(req.body)
        
        if (result.success) {
            const result2 = await service.purchaseTicket(req.body.ticket_type_id, result.insertedId)
            const name = result2.name
            const price = result2.price
            const ticket_id = result.insertedId

            let retries = 0

            const initiatePaymentRetry = async () => {
                try {
                    const TEXT_REF = "tx-myecommerce12345-" + Date.now()
                    const RETURN_URL = `http://localhost:3005/verify-payment/${TEXT_REF}?ticket_id=${ticket_id}`
                    const checkout_url = await service.initiatePayment(TEXT_REF, RETURN_URL, name, price)
                    res.send(checkout_url)
                } catch (error) {
                    console.error("Error initiating payment:", error.message)
                    retries++
                    if (retries < MAX_RETRIES) {
                        setTimeout(initiatePaymentRetry, 2000)
                    } else {
                        res.status(500).json({ error: "Error initiating payment" })
                    }
                }
            }

            initiatePaymentRetry()
        } else {
            res.status(500).json({ success: false, error: "Failed to create ticket" })
        }
    } catch (error) {
        console.error("Error creating ticket:", error)
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}


const generateTicketData = async (ticket_id) => {
    let data = await service.getTicketDetails(ticket_id)
    const markAsUsedurl = `http://localhost:3005/markTicketAsUsed/${ticket_id}`
    const checkIfUsed = `http://localhost:3005/checkticket/${ticket_id}`
    data = {
        data: data,
        markAsUsedurl: markAsUsedurl,
        checkIfUsed: checkIfUsed
    }

    return data
}

exports.verifyPayment = async (req, res) => {
    let retries = 0
    const ticket_id = req.query.ticket_id

    const verifyPaymentRetry = async () => {
        try {
            const isVerified = await service.verifyPayment(req.params.id)
            if (isVerified) {
                console.log("Payment was successfully verified")
                await service.ticketAsPaid(ticket_id)
                
                const data = await generateTicketData(ticket_id)

                const qrcode = await service.createQrCode(JSON.stringify(data))
                res.status(200).json({ message: "Payment was successfully verified", qrcode: qrcode})
            } else {
                console.error("Payment verification failed")
                res.status(400).json({ error: "Payment verification failed" })
            }
        } catch (error) {
            console.error("Error verifying payment:", error.message)
            retries++
            if (retries < MAX_RETRIES) {
                setTimeout(verifyPaymentRetry, 2000)
            } else {
                res.status(500).json({ error: "Error verifying payment" })
            }
        }
    }

    verifyPaymentRetry()
}

exports.createTicketWithoutPayment = async (req, res) => {
    try {
        const result = await service.createTicket(req.body)
        if(result.success){
            const ticket_id = result.insertedId
            const data = await generateTicketData(ticket_id)

            const qrcode = await service.createQrCode(JSON.stringify(data))

            await service.scheduleReminderEmail(ticket_id)
            res.status(201).json({ message: "ticket created", qrcode: qrcode}) 
        }else {
            res.status(500).json({ success: false, error: "Failed to create ticket" })
        }
    } catch (error) {
        console.error("Error creating ticket:", error)
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}

exports.markTicketAsUsed = async (req, res) => {
    try {
        const { ticketId } = req.params

        const success = await service.markTicketAsUsed(ticketId)

        if (success) {
            res.json({ success: true, message: 'Ticket marked as used' })
        } else {
            res.status(404).json({ success: false, message: 'Ticket not found' })
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}

exports.checkTicket = async (req, res) => {
    try {
        const { ticketId } = req.params

        const isUsed = await service.checkTicket(ticketId)

        res.json(isUsed)
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}

exports.getAllReminders = async (req, res) => {
    try {
        const reminders = await service.getAllReminders()

        res.json(reminders)
    }catch (error){
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}

exports.sendReminderEmails = async (req, res) => {
    try {
        const { reminder_id } = req.params

        await service.sendReminderEmails(reminder_id)
        res.json({ success: true, message: 'reminder sent' })

    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}