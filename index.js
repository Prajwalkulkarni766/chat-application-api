const express = require("express");
const cors = require('cors');
const ConnectToMongoose = require("./db");
const app = express();

// connecting to the database
ConnectToMongoose();

// using Continuously Operating Reference Stations(CORS) is a browser security feature that restricts HTTP requests that are initiated from scripts running in the browser
app.use(cors());

// allow to receive data in the form of json
app.use(express.json());

// impoting the routes from authentication.js
app.use("/api/authenticate", require("./routes/authentication"));

// importing the routes from user.js
app.use("/api/user", require("./routes/user"));

// importing the routes from message.js
app.use("/api/message", require("./routes/message"));

// app listening on port 3000
app.listen(3000, () => {
    console.log("Server started on 3000");
})