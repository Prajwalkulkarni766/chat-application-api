const conversationModel = require("../models/conversation");

const check_conversation = async (req, res, next) => {
    try {
        // Checking conversation_id in the request
        if (!req.body.conversation_id) {
            // Checking conversation from 1st point of view
            let conversation1 = await conversationModel.findOne({
                conversation_by: req.body.id,
                conversation_with: req.body.message_for
            });

            // Checking conversation from 2nd point of view
            let conversation2 = await conversationModel.findOne({
                conversation_by: req.body.message_for,
                conversation_with: req.body.id
            });

            // If both points of view not exist
            if (!conversation1 && !conversation2) {
                let conversation = await conversationModel({
                    conversation_by: req.body.id,
                    conversation_with: req.body.message_for,
                });

                // Saving conversation
                await conversation.save();

                // Attaching conversation id 
                req.body.conversation_id = conversation._id;
            } else {
                // If 1st or 2nd point of view exists
                req.body.conversation_id = conversation1 ? conversation1._id : conversation2._id;
            }
        }

        // Conversation id found in request
        else if (req.body.conversation_id) {
            // Finding the conversation with the provided id
            let conversation = await conversationModel.findById(req.body.conversation_id);

            // If conversation with that id not exists
            if (!conversation) {
                res.status(400).json({ message: "Invalid conversation id" });
				return false;
            }
        }
		//return true;
        next(true);
		//return true;
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
		return false;
    }
};

module.exports = check_conversation;