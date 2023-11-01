// Participants Table: This table tracks users who are part of each conversation. The last_read_message_id field can be used to indicate the last message a user has read in a conversation.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const participantsSchema = new Schema({
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversations'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    last_read_message_id: {
        type: String
    },
});

const participants = mongoose.model("paticipants", participantsSchema);
module.exports = participants;