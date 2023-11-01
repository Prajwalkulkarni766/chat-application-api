// Messages Table: Messages should be associated with the conversation they belong to, the user who sent them, and other relevant information. You can include additional fields like attachments, message status, and message deletion flags.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversations'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    messages_type: {
        type: String,
        required: true
    },
});

const messages = mongoose.model("messages", messageSchema);
module.exports = messages;