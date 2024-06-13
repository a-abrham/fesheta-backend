const jwt = require('jsonwebtoken')

async function verifyToken(req, res, next, returnSuccessMessage = false) {
 try {
        const token = req.cookies.token

        if (!token) {
            return res.status(403).json({ error: 'Token not provided' })
        }

        const decoded = jwt.verify(token, process.env.secretKey)

        console.log(decoded)
        
        const personId = decoded.token

        if (req.cookies.id == personId) {
            if (returnSuccessMessage) {
                return res.status(200).json({ message: 'Token verified successfully' })
            }
            next()
        } else {
            return res.status(403).json({ error: 'Unauthorized access' })
        }

    } catch (error) {
        return res.status(401).json({ error: 'Failed to authenticate token' })
    }
}

module.exports = { verifyToken }