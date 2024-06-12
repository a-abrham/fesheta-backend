const express = require('express')
const router = express.Router()
const attendeeController = require('../controllers/attendee-controller')


router.get("/api/verify-payment/:id", attendeeController.verifyPayment)
router.post("/createTicketWpayment", attendeeController.createTicketAndPay)
router.post("/createTicketWOpayment", attendeeController.createTicketWithoutPayment)



router.get("/markTicketAsUsed/:ticketId", attendeeController.markTicketAsUsed)
router.get("/checkticket/:ticketId", attendeeController.checkTicketIsUsed)

module.exports = router