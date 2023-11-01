// Conversations Table: In a more advanced implementation, you might want to store additional metadata about the conversation, such as the last message timestamp, the creator of the group chat, or any other relevant information.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema({
    conversation_name: {
        type: String,
        required: true
    },
    conversation_type: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
});

const conversations = mongoose.model("conversations", conversationSchema);
module.exports = conversations;