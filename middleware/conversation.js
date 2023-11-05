const conversationModel = require("../models/conversation");

const check_conversation = async (req, res, next) => {
    try {

        // checking conversation_id in the request
        if (!req.body.conversation_id) {

            // checking conversation from 1st pov
            let conversation1 = await conversationModel.findOne({ conversation_by: req.body.id, conversation_with: req.body.conversation_with });

            // checking conversation from 2nd pov
            let conversation2 = await conversationModel.findOne({ conversation_by: req.body.conversation_with, conversation_with: req.body.id });

            // if both pov not exists
            if (!conversation1 && !conversation2) {

                let conversation = await conversationModel({
                    conversation_by: req.body.id,
                    conversation_with: req.body.conversation_with,
                });

                // saving conversation
                await conversation.save();

                // attaching conversation id 
                req.body.conversation_id = conversation._id;
            }

            // if 1 pov exists
            if (conversation1) {
                req.body.conversation_id = conversation1._id;
            }
            // if 2 pov exists
            else if (conversation2) {
                req.body.conversation_id = conversation2._id;
            }
        }

        // conversation id found in request
        else if (req.body.conversation_id) {

            // finding the conversation with the provided id
            let conversation = await conversationModel.findById(req.body.conversation_id);

            // if conversation with that id not exists
            if (!conversation) {
                return res.status(400).json({ message: "Invalid conversation id" });
            }
        }
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

module.exports = check_conversation;