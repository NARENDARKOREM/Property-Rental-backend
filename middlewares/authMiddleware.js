const jwt = require('jsonwebtoken');

exports.isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token received:', token); // Debugging
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Debugging
        req.user = decoded; // Ensure `userType` is part of the decoded token
        next();
    } catch (err) {
        console.error('Token error:', err); // Debugging
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
