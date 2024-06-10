const db = require('../config/dbconfig')
const bcrypt = require('bcrypt')

exports.addOrganizer = async (organizerData) => {
    const { username, email, password } = organizerData
    const hashedPassword = await bcrypt.hash(password, 10)
    try {
        await db.query('INSERT INTO organizers (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword])
        return {success: true}
    } catch (error) {
        console.error('Error adding organizer:', error)
        throw error
    }
}

exports.authenticateOrganizer = async (identifier, password) => {
    try {
        let organizer
        const isEmail = /\S+@\S+\.\S+/.test(identifier)

        if (isEmail) {
            [organizer] = await db.query('SELECT * FROM organizers WHERE email = ?', [identifier])
        } else {
            [organizer] = await db.query('SELECT * FROM organizers WHERE username = ?', [identifier])
        }

        const passwordMatch = await bcrypt.compare(password, organizer[0].password)

        if (passwordMatch) {
            return { success: true, message: 'Authentication successful', organizer: organizer }
        } else {
            return { success: false, message: 'Incorrect password' }
        }
    } catch (error) {
        console.error('Authentication failed:', error)
        throw new Error('Authentication failed')
    }
}
