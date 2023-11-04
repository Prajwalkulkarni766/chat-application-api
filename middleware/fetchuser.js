const userModel = require("../models/user");
const mongoose = require("mongoose");

const fetch_user = async (req, res, next) => {
    try {

        // if entered id is not valid type of mongoose object id
        if (!mongoose.Types.ObjectId.isValid(req.body.id)) {
            return res.status(400).json({ message: "Enter valid user id" });
        }

        // destructuring who started conversation userid
        let userid = req.body.id;

        // fetching user
        let user = await userModel.findById(userid);

        // if user not found
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // checking the with started conversation userid is present in the request
        if (req.body.related_with) {

            // destructuring with started conversation userid
            let related_with = req.body.related_with;
            let related_with_conversation_user = await userModel.findById(related_with);

            // if that user not found
            if (!related_with_conversation_user) {
                return res.status(400).json({ message: "User not found" });
            }
        }
        next();
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = fetch_user;