const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupSchema = new Schema({
	group_name:{
		type: String,
		required: true
	},
	group_creator:{
		type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
	},
	profile_image_url: {
        type: String,
		default: ""
    },
	group_memebers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
});

const Group = mongoose.model("Group", groupSchema);
module.exports = Group;