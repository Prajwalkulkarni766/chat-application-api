const express = require("express");
const userModel = require("../models/user");
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secreteKey = process.env.JWT_SECRET_KEY;
const router = express.Router();

// Route for user signup
router.post("/signup", 
    body("name", "Enter a valid name").isLength({ min: 1 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a valid password. Password must contain at least 8 and at most 16 characters.").isLength({ min: 8, max: 16 }),
    async (req, res) => {
        try {
            // Validate request parameters
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if user with the same email already exists
            let newUser = await userModel.findOne({ email: req.body.email });

            if (newUser) {
                return res.status(400).json({ message: "User with this email already exists" });
            }

            // Hash the password before storing it in the database
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Create a new user
            newUser = await userModel({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                profile_image_url: req.body.profile_image_url,
            });

            // Save the new user to the database
            await newUser.save();
			const userId = newUser._id;
			
			/*
			// if you want to send cookie
			const authToken = jwt.sign({ userId: userId }, secreteKey);
			return res.status(201).cookie("token", authToken, { secure: true }); 
			*/
			
			// if you want to send json
			const authToken = jwt.sign({ userId: userId }, secreteKey);
			return res.status(201).json({token: authToken });
			
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// Route for user login
router.post("/login",
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a valid password. Password must contain at least 8 and at most 16 characters.").isLength({ min: 8, max: 16 }),
    async (req, res) => {
        try {
            // Validate request parameters
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if user with the provided email exists
            let existingUser = await userModel.findOne({ email: req.body.email });

            if (!existingUser) {
                return res.status(400).json({ message: "User with this email does not exist" });
            }

            // Check if the entered password matches the stored password
            const passwordMatch = await bcrypt.compare(req.body.password, existingUser.password);

            if (!passwordMatch) {
                return res.status(400).json({ message: "Entered password is incorrect" });
            }
			
			/*
			// if you want to send cookie
			const authToken = jwt.sign({ userId: existingUser._id }, secreteKey);
			return res.status(201).cookie("token", authToken, { secure: true }); 
			*/
			
			// if you want to send json
			const authToken = jwt.sign({ userId: existingUser._id }, secreteKey);
			return res.status(200).json({token: authToken }); 
            
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

module.exports = router;