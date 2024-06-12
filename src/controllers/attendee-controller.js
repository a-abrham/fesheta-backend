const service = require('../services/attendee-services')

const MAX_RETRIES = 5

exports.verifyPayment = async (req, res) => {
    let retries = 0
    const ticket_id = req.query.ticket_id

    const verifyPaymentRetry = async () => {
        try {
            const isVerified = await service.verifyPayment(req.params.id)
            if (isVerified) {
                console.log("Payment was successfully verified")
                await service.ticketAsPaid(ticket_id)
                res.status(200).json({ message: "Payment was successfully verified" })
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
                    const RETURN_URL = `http://localhost:3005/api/verify-payment/${TEXT_REF}?ticket_id=${ticket_id}`
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

exports.createTicketWithoutPayment = async (req, res) => {
    try {
        const result = await service.createTicket(req.body)
        if(result.success){
            let data = await service.getTicketDetails(result.insertedId)
            const url = `http://localhost:3005/markTicketAsUsed/${result.insertedId}`

            data = {
                data: data,
                url: url
            }

            const qrcode = await service.createQrCode(JSON.stringify(data))

            res.status(201).json({ message: "ticket created", qrcode: qrcode}) 
        }else {
            res.status(500).json({ success: false, error: "Failed to create ticket" })
        }
    } catch (error) {
        console.error("Error creating ticket:", error)
        res.status(500).json({ success: false, error: "Internal Server Error" })
    }
}

