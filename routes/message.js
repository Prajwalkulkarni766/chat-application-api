const express = require("express");
const { param, body, validationResult } = require("express-validator");
var multer = require('multer');
const path = require('node:path');
const mongoose = require('mongoose');
const check_conversation = require("../middleware/conversation");
const fetchUser = require("../middleware/fetchUser");
const conversationModel = require("../models/conversation");
const userModel = require("../models/user");
const messageModel = require("../models/messages");
const groupModel = require("../models/group");

// creating router
const router = express.Router();

// middleware
router.use(fetchUser);

// function to send personal message 
const sendPersonalMessage = async (req, res) =>{
	
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
	
	const message_for = await userModel.findById(req.body.message_for);
			
	// if message for user not found
	if(!message_for){
		return res.status(400).json({ message: "Enter valid message for id" });
	}

	// conversation info to be updated
	const update = {
		last_conversation_at: Date.now(),
		last_conversation_message: req.body.message
	};

	// updating the conversation
	const updateConversation = await conversationModel.findByIdAndUpdate(req.body.conversation_id, update, { new: true });
			
	// creating the message model
	const message = await messageModel({
		conversation_id: req.body.conversation_id,
		conversation_type: "Conversation",
		message_by: req.body.id,
		message_for: message_for,
		message: req.body.message,
		message_status: "sent",
	});
	
	// saving the message
	await message.save();
	res.status(200).json({ message: "sent" });
}
		

// function to send group message
const sendGroupMessage = async (req, res) => {
	if(!req.body.conversation_id){
		return res.status(400).json({ message: "Enter group id" });
	}
	
	const groupId = req.body.conversation_id;
	
	const group = await groupModel.findById(groupId);
	
	// if group not found
	if(!group){
		return res.status(400).json({ message: "Group not found"});
	}
	
	// creating the message model
	const message = await messageModel({
		conversation_id: req.body.conversation_id,
		conversation_type: "Group",
		message_by: req.body.id,
		message_for: group.group_memebers,
		message: req.body.message,
		message_status: "sent",
	});
	
	// saving message
	await message.save();
	res.status(200).json({ message: "sent" });
}

// router to send message
router.post("/sendMessage",
	body("conversation_type", "Enter value of Conversation type").isLength({ min: 1 }),
    body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
    body("message", "Enter a message").isLength({ min: 1 }),
    async (req, res, next) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
			// personal message
			if(req.body.conversation_type === "Conversation" || req.body.conversation_type === "conversation"){
				return sendPersonalMessage(req, res);	
			}
			// group message
			else if(req.body.conversation_type === "Group" || req.body.conversation_type === "group"){
				return sendGroupMessage(req, res);
			}
			// invalid conversation type
			else{
				return res.json({ message: "Invalid conversation type" });
			}
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

    });

// router to get multiple conversation list
router.get("/getConversations/:id",
    param("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
			
			const userId = req.params.id;
			
			// empty conversation data list
            const conversationData = [];
			
            // getting conversation
            let conversations = await conversationModel.find({
                $or: [
                    { conversation_by: userId },
                    { conversation_with: userId }
                ]
            }).select("-created_at -__v").exec();

            if(conversations){
				// looping the conversations one by one
				for (const conversation of conversations) {
					let otherUserId = conversation.conversation_by;
					if (otherUserId == req.params.id) {
						otherUserId = conversation.conversation_with;
					}

					const user = await userModel.findById(otherUserId);

					// if user exists
					if (user) {
						// adding add to the array
						conversationData.push({
							conversation_with_name: user.name,
							conversation: conversation
						});
					}
				}
			}
            return res.status(200).json(conversationData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to get previous messages which belong to particular conversation
router.get("/getPreviousMessages/:conversation_id",
    param("conversation_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid conversation id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            // getting message
            let messages = await messageModel.find({ conversation_id: req.params.conversation_id }).exec();
			if(messages){
				return res.status(200).json(messages);
			}
			return res.status(200).json([]);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to get new messages from every conversation user have
router.get("/getNewMessage/:id", param("id").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return Promise.reject("Enter a valid user id");
    }
    return Promise.resolve();
}),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // getting all new messages
            let newmessages = await messageModel.find({
                message_for: req.params.id,
                $or: [
                    { message_status: "sent" },
                    { message_status: "delivered" }
                ]
            }).exec();

			if(newmessages){
				// looping each message one by one to update the message status from sent to delivered
				for (const newmessage of newmessages) {
					const filter = { _id: newmessage._id };
					const update = { message_status: "delivered" };
					let changemessagestatus = await messageModel.findByIdAndUpdate(filter, update, { new: true });
				}
			}

            // returing new messages
            return res.status(200).json({ newmessages });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to convert the status of message from delivered to read
router.put("/changeMessageStatus",
    body("message_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter valid message id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            // filtering message by id
            const filter = { _id: req.body.message_id };

			// getting message
			const message = await messageModel.findById(filter);
			
			// if id match with message for id then update the message
			if(req.body.id == message.message_for){
				// update content
				const update = { message_status: "read" };

				// updating the message
				let updatestatus = await messageModel.findByIdAndUpdate(filter, update, { new: this.true });

				return res.status(200).json({ message: "Updated status" });
			}
			// if not matched then don't update the message
			else{
				return res.status(401).json({ message: "Problem while updating the status of message. Check you have provided correct id which is equal to message_for of that message" });
			}
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" })
        }
    });


// router to upload a file
var pathString = "";
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './docs')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        pathString = datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, pathString);
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        callback(null, true)
    }
}).single('file');

router.post("/sendFile", check_conversation, async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            upload(req, res, function (err) {
                if (err) {
                    reject("Error uploading file.");
                } else {
                    resolve();
                }
            });
        });
		
		let newPath = path.join('/docs', pathString);
        const message = await messageModel({
            conversation_id: req.body.conversation_id,
            conversation_type: "Conversation",
			message_by: req.body.id,
            message_for: req.body.message_for,
            message: newPath,
            message_status: "sent",
            message_type: "file",
        });

        await message.save();
		
		const conversationId = { _id: req.body.conversation_id };

        const update = {
            last_conversation_at: Date.now(),
            last_conversation_message: newPath
		};
		
        const updateConversation = await conversationModel.findByIdAndUpdate(conversationId, update, { new: true });
		
        return res.status(200).end();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// router to get a file
router.get("/getFile/:message_id",
    param("message_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter valid message id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // getting message id
            let message_id = req.params.message_id;

            // fetching message
            let message = await messageModel.findById(message_id);

            // if user doesn't uploaded document yet
            if (message.message_type !== "file") {
                return res.status(400).json({ message: "Invalid message id" });
            }

            // Get the current directory
            const currentDirectory = process.cwd();

            // getting document url
            let document_url = path.join(currentDirectory, message.message);

            // returning document
            return res.status(200).sendFile(document_url);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to download the file
router.get("/downloadFile/:message_id",
    param("message_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter valid message id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // getting message id
            let message_id = req.params.message_id;

            // fetching message
            let message = await messageModel.findById(message_id);

            // if message not found
            if (!message) {
                return res.status(400).json({ message: "Invalid message id" })
            }

            // Get the current directory
            const currentDirectory = process.cwd();

            // getting document url
            let document_url = path.join(currentDirectory, message.message);

            // returning document
            return res.status(200).download(document_url);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" })
        }
    });

// router to delete conversation and messages
router.delete("/deleteConversation",
    body("conversation_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter valid conversation id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // Assign the validation result
        const errors = validationResult(req);

        // If errors are not empty, return 400 status with error details
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Destructure conversation id from URL parameters
            const { conversation_id } = req.body;

            // Find and delete the conversation
            const conversation = await conversationModel.findByIdAndDelete(conversation_id);

            // Check if conversation is not found
            if (!conversation) {
                return res.status(404).json({ message: "Conversation not found" });
            }

            // Delete associated messages
            const messages = await messageModel.deleteMany({ conversation_id: conversation_id });

            // Return 200 status with success message
            return res.status(200).json({ message: "Conversation and messages deleted" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

module.exports = router;