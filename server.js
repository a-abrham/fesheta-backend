require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(bodyParser.json())
app.use(cors())
app.use(express.urlencoded({ extended: true}))

app.use('/', require('./src/routes/event-routes'))
app.use('/', require('./src/routes/organizer-routes'))
app.use('/', require('./src/routes/attendee-routes'))

const PORT = process.env.PORT || 3005
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})