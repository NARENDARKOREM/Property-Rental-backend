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
  } else {
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

// exports.isHost = async (req, res, next) => {
//   if (req.user && req.user.role === "host") {
//     next();
//   } else {
//     return res
//       .status(403)
//       .json({ error: "Permission denied. Host access only." });
//   }
// };


exports.isAdminOrHost = async (req, res, next) => {
  try {
    const { id, userType } = req.user;
    console.log("User Data from Token:", req.user);

    if (userType === "admin") {
      const admin = await Admin.findByPk(id);

      if (!admin) {
        return res.status(403).json({ error: "Permission denied. Admin access only." });
      }
      
      console.log("Admin access granted.");
      return next();
    } 

    else if (userType === "user") {
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.role !== "admin" && user.role !== "host") {
        return res.status(403).json({
          error: "Permission denied. Admin or Host access only."
        });
      }

      console.log("Host access granted.");
      return next();
    } 

    else {
      return res.status(403).json({ error: "Permission denied." });
    }
  } catch (error) {
    console.error("Error in isAdminOrHost middleware:", error);

    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};


exports.isHost = async (req, res, next) => {
  try {
    const { id } = req.user; // Get the user ID from the request
    const user = await User.findByPk(id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the user has the "host" role
    if (user.role !== "host") {
      return res.status(403).json({ error: "Permission denied. Host role required." });
    }

    // Generate a JWT token after confirming the host role
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Proceed to the next middleware or route handler
    return next(); // Uncomment if you need the middleware to allow further requests after token generation

  } catch (error) {
    console.error("Error in isHost middleware:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

