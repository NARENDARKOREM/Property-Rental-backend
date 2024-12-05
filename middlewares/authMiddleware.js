const jwt = require("jsonwebtoken");
const Admin = require('../models/Admin');
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
    if (decoded.userType === 'admin') {
      req.user = await Admin.findByPk(decoded.id);
    } else {
      req.user = await User.findByPk(decoded.id);
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    next();
  } catch (err) {
    console.error("Token verification error", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
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

exports.isAdmin = async (req, res, next) => {
  try {
    const { id, userType } = req.user;

    if (userType !== "admin") {
      return res.status(403).json({ error: "Permission denied. Admin access only." });
    }

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(403).json({ error: "Permission denied. Admin access only." });
    }

    console.log("Admin access granted");
    next();
  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
