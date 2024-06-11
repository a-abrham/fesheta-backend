const express = require('express')
const router = express.Router()
const attendeeController = require('../controllers/attendee-controller')


router.get("/pay", attendeeController.pay)
router.get("/api/verify-payment/:id", attendeeController.verifyPayment)
router.post("/createTicket", attendeeController.createTicket)


module.exports = router