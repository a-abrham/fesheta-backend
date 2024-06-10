const organizerService = require('../services/organizer-services');

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
            res.json({success: true});
        } else {
            res.status(401).json(authResult);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authentication failed', error: error.message });
    }
};
