const jwt = require("jsonwebtoken");
const User = require('../models/User');

exports.isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token: ", token); // Log the token
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

    console.log("Decoded token: ", decoded); // Log the decoded token

    req.user = await User.findByPk(decoded.id);
    console.log("Authenticated user: ", req.user); // Log the user


    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    next();
  } catch (err) {
    console.error("Token verification error: ", err);
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


exports.isAdminOrHost = async (req, res, next) => {
  try {
    const { id, userType } = req.user;
    console.log(req.user,"from admin cred");

    if (userType === "admin") {
      const admin = await Admin.findByPk(id);

      if (!admin) {
        return res.status(403).json({ error: "Permission denied. Admin access only." });
      }
      console.log("Admin access granted");
      return next();
    } else if (userType === "user") {
      const user = await User.findByPk(id);

      if (!user || (user.role !== 'admin' && user.role !== 'host')) {
        return res.status(403).json({ error: "Permission denied. Admin or Host access only." });
      }
      console.log("Host access granted");
      return next();
    } else {
      return res.status(403).json({ error: "Permission denied." });
    }
  } catch (error) {
    console.error("Error in isAdminOrHost middleware:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

