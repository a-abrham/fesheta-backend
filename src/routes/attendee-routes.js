const express = require('express')
const router = express.Router()
const attendeeController = require('../controllers/attendee-controller')


router.get("/verify-payment/:id", attendeeController.verifyPayment)
router.post("/createTicketWpayment", attendeeController.createTicketAndPay)
router.post("/createTicketWOpayment", attendeeController.createTicketWithoutPayment)



router.get("/markTicketAsUsed/:ticketId", attendeeController.markTicketAsUsed)
router.get("/checkticket/:ticketId", attendeeController.checkTicketIsUsed)


router.get("/reminders", attendeeController.getAllReminders)
router.get("/send-reminder/:reminder_id", attendeeController.sendReminderEmails)

module.exports = router