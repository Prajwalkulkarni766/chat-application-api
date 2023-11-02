const express = require("express");
var multer = require('multer');
const userModel = require("../models/user");
const path = require('node:path');
const { body, validationResult } = require('express-validator');

// creating the router
const router = express.Router();

// route for get user
router.get("/getuser",
    body("id", "Enter a userid").isLength({ min: 24 }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // assigning id
            let userid = req.body.id;

            // getting user
            let user = await userModel.findById(userid).select("-password");

            if (!user) {
                return res.status(400).json({ message: "User with this is not exists" });
            }

            return res.status(200).send(user);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// route for changing name of user
router.post("/changename",
    body("email", "Enter a valid email").isEmail(),
    body("name", "Enter valid name").isLength({ min: 1 })
    , async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // creating filter based on email
            const filter = { email: req.body.email };

            // creating update for name
            const update = { name: req.body.name };

            // new true because we want to return newly updated document
            const updateuser = await userModel.findOneAndUpdate(filter, update, {
                new: true
            });

            return res.status(200).send(updateuser);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// route for changing email of user
router.post("/changeemail",
    body("email", "Enter a valid email").isEmail(),
    body("newemail", "Enter valid email").isEmail()
    , async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // creating filter based on email
            const filter = { email: req.body.email };

            // creating update for email
            const update = { email: req.body.newemail };

            // new true because we want to return newly updated document
            const updateuser = await userModel.findOneAndUpdate(filter, update, {
                new: true
            });

            return res.status(200).send(updateuser);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// route for changing password of user
router.post("/changepassword",
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter valid password").isLength({ min: 8 })
    , async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // creating filter based on email
            const filter = { email: req.body.email };

            // creating update for password
            const update = { password: req.body.password };

            // new true because we want to return newly updated document
            const updateuser = await userModel.findOneAndUpdate(filter, update, {
                new: true
            });

            return res.status(200).send(updateuser);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// change the profile 
var abc = "";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './docs')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        abc = datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, abc);
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024
    }
}).single('profile_img');

router.put('/profileimg', async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            upload(req, res, function (err) {
                if (err) {
                    reject("Error uploading profile image.");
                } else {
                    resolve();
                }
            });
        });

        // creating filter based on email
        const filter = { email: req.body.email };

        // creating update for image
        const update = { profile_image_url: "/docs/" + abc };

        // new true because we want to return the newly updated document
        const updateuser = await userModel.findOneAndUpdate(filter, update, {
            new: true
        });

        return res.status(200).end(abc);
    } catch (error) {
        return res.status(400).end(error);
    }
});

// get profile image
router.get("/profileimg",
    body("email", "Enter valid email").optional().isEmail(),
    body("id", "Enter a valid user id").optional().isLength({ min: 24 }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            let user = "";
            if (req.body.email) {
                user = await userModel.findOne({ email: req.body.email });
            }
            else {
                let userid = req.body.id;
                user = await userModel.findById(userid);
            }

            // if user not found
            if (!user) {
                return res.status(400).json({ message: "User with this email address don't exist" });
            }

            // Get the current directory
            const currentDirectory = process.cwd();

            // getting profile image url
            let profile_image_url = path.join(currentDirectory, user.profile_image_url);

            // returning profile img
            return res.status(200).sendFile(profile_image_url);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    })

// exporting above created user
module.exports = router;