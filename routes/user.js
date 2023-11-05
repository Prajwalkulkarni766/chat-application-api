const express = require("express");
var multer = require('multer');
const path = require('node:path');
const { body, validationResult } = require('express-validator');
const userModel = require("../models/user");
const fetch_user = require('../middleware/fetchuser');
const mongoose = require('mongoose');

// creating the router
const router = express.Router();

// route for get user
router.get("/getUser",
    body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // assigning id
            let userId = req.body.id;

            // getting user
            let user = await userModel.findById(userId).select("-password");

            // if user not exists
            if (!user) {
                return res.status(400).json({ message: "User with this id not exists" });
            }

            return res.status(200).send(user);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// router to change the profile image
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

router.put('/profileImg', async (req, res) => {
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
        console.error(error);
        return res.status(400).end(error);
    }
});

// using fetch_user function as a middleware
router.use(fetch_user);

// route for changing name of user
router.put("/changeName",
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
            const filter = { _id: req.body.id };

            // creating update for name
            const update = { name: req.body.name };

            // new true because we want to return newly updated document
            const updateuser = await userModel.findByIdAndUpdate(filter, update, { new: true });

            return res.status(200).send(updateuser);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// route for changing email of user
router.put("/changeEmail",
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
            const filter = { _id: req.body.id };

            // creating update for email
            const update = { email: req.body.newemail };

            // new true because we want to return newly updated document
            const updateuser = await userModel.findByIdAndUpdate(filter, update, { new: true });

            return res.status(200).send(updateuser);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// route for changing password of user
router.put("/changePassword",
    body("password", "Enter valid password having minimum character 8 and maximum character 16").isLength({ min: 8, max: 16 })
    , async (req, res) => {

        // assigining the validation result
        const errors = validationResult(req);

        // error are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {

            // creating filter based on email
            const filter = { _id: req.body.id };

            // creating update for password
            const update = { password: req.body.password };

            // new true because we want to return newly updated document
            const updateuser = await userModel.findByIdAndUpdate(filter, update, { new: true });

            return res.status(200).send(updateuser);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    });

// get profile image
router.get("/profileImg", async (req, res) => {
    try {
        let userid = req.body.id;
        let user = await userModel.findById(userid);

        // if user doesn't uploaded image yet
        if (!user.profile_image_url || user.profile_image_url === "") {
            return res.status(400).json({ message: "User doesn't uploaded profile image yet" });
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
});

// exporting above created user
module.exports = router;