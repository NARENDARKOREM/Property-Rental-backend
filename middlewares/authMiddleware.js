const jwt = require("jsonwebtoken");
const User = require('../models/User');

exports.isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("Token ", token);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decode ", decoded);
    
    req.user = await User.findByPk(decoded.id);

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user.userType = 'user'; // Ensure userType is set
    next();
  } catch (err) {
    console.error("Token verification error", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};


exports.isGuest = (req, res, next) => {
  if (req.user && req.user.role === "guest") {
    next();
  } else {
    return res.status(403).json({ error: "Permission denied. Guest access only." });
  }
};

exports.isHost = async (req, res, next) => {
  if (req.user && req.user.role === "host") {
    next();
  } else {
    return res.status(403).json({ error: "Permission denied. Host access only." });
  }
};


exports.isStaff = (permission) => {
  return (req, res, next) => {
    if (
      req.user &&
      req.user.userType === "Staff" &&
      !req.user.permissions.includes(permission)
    ) {
      return res
        .status(403)
        .json({ error: `Forbidden: ${permission} permission required` });
    }
    next();
  };
};

