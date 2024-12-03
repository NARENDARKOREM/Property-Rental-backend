const jwt = require('jsonwebtoken');

exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

exports.isStaff = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.userType === 'Staff' && !req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: `Forbidden: ${permission} permission required` });
    }
    next();
  };
};
