exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.userType !== 'admin'|| req.user.role !== "host") {
        return res.status(403).json({ error: 'Permission denied. Admin access only.' });
    }
    console.log('Admin access granted'); // Debugging
    next();
};
