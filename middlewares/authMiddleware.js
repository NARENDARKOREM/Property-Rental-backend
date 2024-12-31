const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");

exports.isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token received:", token);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    console.log("User  found:", user); // Log the user

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    return res
      .status(401)
      .json({ error: "Unauthorized: Authentication failed" });
  }
};

exports.optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      req.user = user; 
    } catch (err) {
      console.error("Authentication error:", err.message);
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }
  }
  else{
    req.user = null;
  }

  next();
};

exports.authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: "Forbidden" });
  }
};

exports.isGuest = (req, res, next) => {
  if (req.user && req.user.role === "guest") {
    next();
  } else {
    return res
      .status(403)
      .json({ error: "Permission denied. Guest access only." });
  }
};

exports.isHost = async (req, res, next) => {
  if (req.user && req.user.role === "host") {
    next();
  } else {
    return res
      .status(403)
      .json({ error: "Permission denied. Host access only." });
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
    console.log(req.user, "from admin cred");

    if (userType === "admin") {
      const admin = await Admin.findByPk(id);

      if (!admin) {
        return res
          .status(403)
          .json({ error: "Permission denied. Admin access only." });
      }
      console.log("Admin access granted");
      return next();
    } else if (userType === "user") {
      const user = await User.findByPk(id);

      if (!user || (user.role !== "admin" && user.role !== "host")) {
        return res
          .status(403)
          .json({ error: "Permission denied. Admin or Host access only." });
      }
      console.log("Host access granted");
      return next();
    } else {
      return res.status(403).json({ error: "Permission denied." });
    }
  } catch (error) {
    console.error("Error in isAdminOrHost middleware:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
