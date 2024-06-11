const service = require('../services/attendee-services')

const MAX_RETRIES = 5

exports.pay = async (req, res) => {
    let retries = 0

    const initiatePaymentRetry = async () => {
        try {
            const TEXT_REF = "tx-myecommerce12345-" + Date.now()
            const RETURN_URL = "http://localhost:3005/api/verify-payment/" + TEXT_REF
            const checkout_url = await service.initiatePayment(TEXT_REF, RETURN_URL)
            res.redirect(checkout_url)
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
}

exports.verifyPayment = async (req, res) => {
    let retries = 0

    const verifyPaymentRetry = async () => {
        try {
            await service.verifyPayment(req.params.id)
            console.log("Payment was successfully verified")
            res.status(200).json({ message: "Payment was successfully verified" })
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

exports.createTicket = async (req, res) => {
    try {
        const result = await service.createTicket(req.body);
        if (result.success) {
            const result2 = await service.purchaseTicket(req.body.ticket_type_id, result.insertedId)
            const name = result2.name
            const price = result2.price
            const ticket_id = result.insertedId
        }
        res.status(201).json({ success: true, message: "Ticket created successfully" });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};