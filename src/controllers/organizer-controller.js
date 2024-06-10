const organizerService = require('../services/organizer-services');
const jwt = require('jsonwebtoken')

exports.addOrganizer = async (req, res) => {
    try {
        const result = await organizerService.addOrganizer(req.body);
        if(result.success){
        res.json({ success: true, message: 'Organizer added successfully'});
        }else{
            res.json({success: false, message: 'Failed to add organizer', error: error.message})
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add organizer', error: error.message });
    }
};

exports.authenticateOrganizer = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const authResult = await organizerService.authenticateOrganizer(identifier, password);
        if (authResult.success) {
            const organizer = authResult.organizer[0]
            const realToken = jwt.sign({ organizer }, process.env.secretKey, {
                expiresIn: "30d",
              });
        console.log(organizer)


        res
        .cookie("token", realToken, { httpOnly: true })
        .cookie("id", organizer.username)

      res.status(200).json({
        success: true,
        message: "Authentication successful",
      });

        } else {
            res.status(401).json(authResult);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authentication failed', error: error.message });
    }
};
