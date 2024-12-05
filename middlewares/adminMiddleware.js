const Admin = require('../models/Admin');

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