const express = require("express");
const { body, validationResult } = require("express-validator");
var multer = require('multer');
const path = require('node:path');
const mongoose = require('mongoose');
const check_conversation = require("../middleware/conversation");
const fetch_user = require("../middleware/fetchuser");
const conversationModel = require("../models/conversation");
const userModel = require("../models/user");
const messageModel = require("../models/messages");

// creating router
const router = express.Router();

// middleware
router.use(fetch_user);

// router to send message
router.post("/sendMessage", check_conversation,
    body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
    body("conversation_with").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid conversation with id");
        }
        return Promise.resolve();
    }),
    body("message", "Enter a message").isLength({ min: 1 }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            // creating a filter
            const filter = { _id: req.body.conversation_id };

            // data info
            const update = {
                last_conversation_at: Date.now(),
                last_conversation_message: req.body.message
            };

            // updating the data
            const updateConversation = await conversationModel.findByIdAndUpdate(filter, update, { new: true });

            // saving the message
            const message = await messageModel({
                conversation_id: req.body.conversation_id,
                messaage_by: req.body.id,
                messaage_for: req.body.conversation_with,
                message: req.body.message,
                message_status: "sent",
            });

            await message.save();
            return res.status(200).send("message sent");
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

    });

// router to get multiple conversation list
router.get("/getConversations",
    body("id").custom((value) => {
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
            // getting conversation
            let conversations = await conversationModel.find({
                $or: [
                    { conversation_by: req.body.id },
                    { conversation_with: req.body.id }
                ]
            }).select("-created_at -__v").exec();

            // empty conversation data list
            const conversationData = [];

            // looping the conversations one by one
            for (const conversation of conversations) {
                let otherUserId = conversation.conversation_by;
                if (otherUserId === req.body.id) {
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

            return res.status(200).json(conversationData);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to get previous messages which belong to particular conversation
router.get("/getPreviousMessages",
    body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
    body("conversation_id").custom((value) => {
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
            let messages = await messageModel.find({ conversation_id: req.body.conversation_id }).exec();

            return res.status(200).json(messages);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to get new messages from every conversation user have
router.get("/getNewMessage", body("id").custom((value) => {
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
                messaage_for: req.body.id,
                $or: [
                    { message_status: "sent" },
                    { message_status: "delivered" }
                ]
            }).exec();

            // looping each message one by one to update the message status from sent to delivered
            for (const newmessage of newmessages) {
                const filter = { _id: newmessage._id };
                const update = { message_status: "delivered" };
                let changemessagestatus = await messageModel.findByIdAndUpdate(filter, update, { new: true });
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

            // update content
            const update = { message_status: "read" };

            // updating the message
            let updatestatus = await messageModel.findByIdAndUpdate(filter, update, { new: this.true });

            return res.status(200).json({ message: "Updated status" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" })
        }
    });

// router to upload a file
var abc = "";
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './docs')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        abc = datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, abc);
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        callback(null, true)
    }
}).single('file');

router.post("/sendFile", async (req, res) => {
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

        const message = await messageModel({
            conversation_id: req.body.conversation_id,
            messaage_by: req.body.id,
            messaage_for: req.body.conversation_with,
            message: "/docs/" + abc,
            message_status: "sent",
            message_type: "file",
        });

        await message.save();
        return res.status(200).json(message._id);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});


// router to get a file
router.get("/getFile",
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

            // getting message id
            let message_id = req.body.message_id;

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
router.get("/downloadFile",
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

            // getting message id
            let message_id = req.body.message_id;

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

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            // destrucing conversation id
            let conversation_id = req.body.conversation_id;

            // finding conversation in collection conversations and deleting it
            const conversation = await conversationModel.findByIdAndDelete(conversation_id);

            // finding messages in collection messages and deleting it
            const message = await messageModel.deleteMany({ conversation_id: conversation_id });

            // returning satus code
            return res.status(200).json({ message: "Conversation and messages deleted" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

module.exports = router;