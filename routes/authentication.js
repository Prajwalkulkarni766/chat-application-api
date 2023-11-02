const express = require("express");
const userModel = require("../models/user");
const { body, validationResult } = require('express-validator');

// creating the router
const router = express.Router();

// router to signup
router.post("/signup", body("name", "Enter a valid name").isLength({ min: 1 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a valid password. Password must contain atleast 8 characters.").isLength({ min: 8 }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {

            // checking user with same email exsist or not
            let newUser = await userModel.findOne({ email: req.body.email });

            // if exists
            if (newUser) {
                return res.status(400).json({ message: "User with this email already exists" });
            }

            // if not exists
            newUser = await userModel({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                profile_image_url: req.body.profile_image_url,
            });

            // saving the user
            await newUser.save();

            // getting newly created user's id
            let newUserId = newUser._id;

            // sending user id in response 
            return res.status(200).json({ id: newUserId });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// route for login
router.post("/login",
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a valid password. Password must contain atleast 8 characters.").isLength({ min: 8 }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // checking that user with this email exists or not
            let existingUser = await userModel.findOne({ email: req.body.email });

            // if user not exists
            if (!existingUser) {
                return res.status(400).json({ message: "User with this email not exists" });
            }

            // if entered password not matches with stored/given password
            if (req.body.password !== existingUser.password) {
                return res.status(400).json({ message: "Entered password is incorrect" });
            }

            // sending id in the response
            let userID = existingUser._id;
            return res.status(200).send(userID);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// exporting above created user
module.exports = router;