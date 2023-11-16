const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

// mongodb uri
const mongoURI = process.env.MONGO_URI;

const ConnectToMongoose = async () => {
    try {
        await mongoose.connect(`${mongoURI}`);
        console.log('connected');
    }
    catch (err) {
        console.log('failed to connect with database',err);
    }
}

module.exports = ConnectToMongoose;