
const jwt = require("jsonwebtoken");
const Admin = require('../models/Admin');

exports.isAdmin = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("Token: ", token);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token: ", decoded);
    req.user = await Admin.findByPk(decoded.id);
    console.log("Admin user: ", req.user);

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Admin not found" });
    }

    req.user.userType = 'admin'; // Ensure userType is set
    next();
  } catch (err) {
    console.error("Token verification error: ", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

};

