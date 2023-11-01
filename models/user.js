// Users Table: You can include additional fields to store user settings, preferences, and more. User authentication and authorization are crucial for securing user data.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profile_image_url: {
        type: String
    },
    signup_date: {
        type: Date,
        default: Date.now
    },
});

const users = mongoose.model("users", userSchema);
module.exports = users;