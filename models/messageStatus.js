// MessageStatus Table: This table can track the status of each message for each user, such as whether it's been read or delivered. This is important for tracking message delivery and read receipts.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageStatusSchema = new Schema({
    message_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'messages'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: String
    }
});

const messageStatus = mongoose.model("messageStatus", messageStatusSchema);
module.exports = messageStatus;