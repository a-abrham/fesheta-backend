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