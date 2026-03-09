const jwt = require('jsonwebtoken');

// A secure secret key for signing tokens (in a real app, this goes in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_admin_key_123!';

// Hardcoded admin credentials for simplicity
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'password123'
};

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space (format: "Bearer <token>")
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];

        // Verify the token
        jwt.verify(bearerToken, JWT_SECRET, (err, authData) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            // Add the decoded payload to request and proceed
            req.admin = authData;
            next();
        });
    } else {
        // Forbidden
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
};

// Middleware to verify student tokens
const verifyStudentToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];

        jwt.verify(bearerToken, JWT_SECRET, (err, authData) => {
            if (err) {
                return res.sendStatus(403);
            }
            // Ensure this token belongs to a student
            if (authData.role !== 'student') {
                return res.sendStatus(403);
            }
            req.studentData = authData;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

module.exports = {
    verifyToken,
    verifyStudentToken,
    JWT_SECRET,
    ADMIN_CREDENTIALS
};
