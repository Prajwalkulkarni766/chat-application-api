const jwt = require('jsonwebtoken');
const secreteKey = process.env.JWT_SECRET_KEY;

const fetchUser = (req, res, next) => {
    const token = req.header('token');
    // if token is not valid then send response 401
    if (!token) {
        return res.send(401).json({ error: 'Please provide vaild token' });
    }
    try {
        // verify the token
        const data = jwt.verify(token, secreteKey);
        // append all data to the request
        req.user = data.user;
        // next means moving to the next function
        next();
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = fetchUser;
