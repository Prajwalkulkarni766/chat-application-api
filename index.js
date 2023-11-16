const express = require("express");
const cors = require('cors');
const connectToMongoose = require("./db");
const app = express();
const multer = require("multer");
const port = process.env.PORT || 5000;

// Connecting to the database
connectToMongoose();

// Using Continuously Operating Reference Stations (CORS) for receving requets from the browser
app.use(cors());

// Allow receiving data in the form of JSON
app.use(express.json());

// Importing routes
app.use("/api/authenticate", require("./routes/authentication"));
app.use("/api/user", require("./routes/user"));
app.use("/api/message", require("./routes/message"));
app.use("/api/group", require("./routes/group"));

// App listening on the specified port
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});