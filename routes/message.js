const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post("/", (req, res) => {
    res.status(200).send("Hello");
});

module.exports = router;