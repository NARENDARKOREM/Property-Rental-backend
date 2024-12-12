const jwt = require("jsonwebtoken");
const User = require('../models/User');
const Admin = require("../models/Admin");

exports.isAuthenticated = async (req, res, next) => {

  const token =req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("Token: ", token); // Log the token
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in the environment variables.");
    }

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }
    req.user = user;

    next();
  } catch (err) {
    console.error("Authentication error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: Token has expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    return res.status(401).json({ error: "Unauthorized: Authentication failed" });
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

