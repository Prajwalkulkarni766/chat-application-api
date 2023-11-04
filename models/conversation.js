const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema({
    conversation_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    conversation_with: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    last_conversation_at: {
        type: Date,
        default: Date.now
    },
    last_conversation_message: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
});

const conversations = mongoose.model("conversations", conversationSchema);
module.exports = conversations;