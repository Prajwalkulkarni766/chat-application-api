const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'conversation_type' // reference to another field
    },
    conversation_type: {
        type: String,
        required: true,
        enum: ['Conversation', 'Group'] // enum to specify possible reference types
    },
    message_by: {
        type: mongoose.Schema.Types.ObjectId,
		required: true,
        ref: 'User'
    },
    message_for: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
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

const Message = mongoose.model("Message", messageSchema);
module.exports = Message; 