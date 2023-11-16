const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema({
    conversation_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    conversation_with: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
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

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
