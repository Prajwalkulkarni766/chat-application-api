const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversations'
    },
    messaage_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    messaage_for: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    message: {
        type: String,
        required: true
    },
    message_status: {
        type: String,
        required: true
    },
    message_type: {
        type: String,
        default: "text"
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
});

const messages = mongoose.model("messages", messageSchema);
module.exports = messages;