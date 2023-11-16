const express = require("express");
const multer = require('multer');
const path = require('node:path');
const { param, body, validationResult } = require("express-validator");
const fs = require("fs");
const mongoose = require('mongoose');
const groupModel = require("../models/group");
const fetchUser = require("../middleware/fetchUser");
const messageModel = require("../models/messages");
const userModel = require("../models/user");

const router = express();

router.use(fetchUser);

// router to create a group
router.post("/createGroup", 
	body("group_name","Enter a valid group name").isLength({ min: 1 }),
	body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
	async (req, res)=>{
		
    // assigining the validation result
    const errors = validationResult(req);

    // error are not empty
    if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
    }

	try{
		const group = await groupModel({
			group_name: req.body.group_name,
			group_creator: req.body.id,
			group_memebers: req.body.id,
		});
		
		await group.save();
		
		return res.status(201).json({ id: group._id });
	}
	catch(error){
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

// router to delete the group
router.delete("/deleteGroup", 
	body("group_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid group id");
        }
        return Promise.resolve();
    }),
	body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
	async (req, res)=>{	
	
    // assigining the validation result
    const errors = validationResult(req);

    // error are not empty
    if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
    }

	try{
		const groupId = req.body.group_id;
		const userId = req.body.id;
		//return res.send(groupId);
		let group = await groupModel.findById(groupId);
		
		if(group){
			if(group.group_creator == userId){
				group = await groupModel.findByIdAndDelete(groupId);
				let messages = await messageModel.deleteMany({ conversation_id: groupId });
				return res.status(200).json({ message: "Group deleted" });
			}
			else{
				return res.status(404).json({ message: "You don't have right to delete this group because this group is not created by you" });
			}
		}
		else{
			return res.status(404).json({ message: "Enter valid group id" });
		}
	}
	catch(error){
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

// router to add new memebers in the group
router.put("/addMember", 
	body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
	body("group_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid group id");
        }
        return Promise.resolve();
    }),
	body("new_memeber_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid new member id");
        }
        return Promise.resolve();
    }),
	async (req, res)=>{
		
    // assigining the validation result
    const errors = validationResult(req);

    // error are not empty
    if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() })
    }

	try{
		const userId = req.body.id;
		const groupId = req.body.group_id;
		const newMemberId = req.body.new_memeber_id;
		
		const group = await groupModel.findById(groupId);
		
		// group not exists
		if(!groupId){
			return res.status(400).json({ message: "Group not found" });
		}
		
		// user is not admin of that group
		if(group.group_creator != userId){
			return res.status(404).json({ message: "You don't have right to add new memeber in this group because this group is not created by you" });
		}
		
		await groupModel.findByIdAndUpdate(groupId, { $push: {group_memebers: newMemberId}}, {new: true});
		
		return res.status(200).json({ message: "added" });
	}
	catch(error){
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

// router to remove memebers from the group
router.put("/removeMember", 
    body("id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id");
        }
        return Promise.resolve();
    }),
    body("user_id_remove").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid user id to remove");
        }
        return Promise.resolve();
    }),
    body("group_id").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid group id");
        }
        return Promise.resolve();
    }),
    async (req, res) => {
        // Assigning the validation result
        const errors = validationResult(req);

        // Errors are not empty
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userId = req.body.id;
            const userIdToRemove = req.body.user_id_remove;
            const groupId = req.body.group_id;

			const removeUser = await userModel.findById(userIdToRemove);
			if(!removeUser){
				return res.status(404).json({ message: "User not found that to be removed from the group" });
			}
			
            const group = await groupModel.findById(groupId);
			if (!group) {
                return res.status(400).json({ message: "Group not found" });
            } else if (group.group_creator != userId) {
                return res.status(400).json({ message: "You don't have the right to remove a member from this group because this group was not created by you" });
            }
			
			
			const result = await groupModel.findByIdAndUpdate(groupId,
				{$pull: {group_memebers: userIdToRemove}},
				{safe: true, upsert: true}
			);

			return res.status(200).json({ message: "removed" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
);

// router to change the profile image of group
var pathString = "";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './docs')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        pathString = datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
        cb(null, pathString);
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

router.put("/profileImg", async (req, res)=>{
	try {
        await new Promise((resolve, reject) => {
            upload(req, res, function (err) {
                if (err) {
                    console.error(err);
                    reject("Error uploading profile image.");
                } else {
                    resolve();
                }
            });
        });

		const groupId = req.body.group_id;
		const userId = req.body.id;
        const group = await groupModel.findById(groupId);

		if(group.group_creator != userId){
			return res.status(400).json({ message: "You don't have right to update the profile image of this group because this group is not created by you" });
		}
		
		// checking that user previously uploaded any image or not if yes then delete that image
        if (group.profile_image_url && group.profile_image_url !== "") {
            const currentDirectory = process.cwd();
            const profileImageUrl = path.join(currentDirectory, group.profile_image_url);
            fs.unlinkSync(profileImageUrl);
        }

		// updating the group information in database
        const update = { profile_image_url: path.join('/docs', pathString) };
        const updateGroup = await groupModel.findByIdAndUpdate(groupId, update, { new: true });
        return res.status(204).end(); // No Content
    } catch (error) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
});

// router to get profile image of group
router.get("/profileImg/:groupId", 
	param("groupId").custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return Promise.reject("Enter a valid group id");
        }
        return Promise.resolve();
    }),
	async(req, res)=>{
	try{
		const groupId = req.params.groupId;
		const group = await groupModel.findById(groupId);
		
		// group not found
		if(!group){
			return res.status(400).json({ message : "Group not found" });
		}
		// profile image is not uploaded
		else if(!group.profile_image_url || group.profile_image_url === ""){
			return res.status(400).json({ message : "Profile image is not uploaded for this group" });
		}
		// Get the current directory
        const currentDirectory = process.cwd();
        // getting profile image url
        let profile_image_url = path.join(currentDirectory, group.profile_image_url);
        // returning profile img
        return res.status(200).sendFile(profile_image_url);
	}
	catch(error){
		console.error(error);
		return res.status(500).json({ message : "Internal server error" });
	}
});

module.exports = router;