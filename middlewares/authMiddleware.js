const jwt = require("jsonwebtoken");

exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  console.log("Token ", token);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decode ", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error ", err);
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

exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== "admin") {
    return res
      .status(403)
      .json({ error: "Permission denied. Admin access only." });
  }
  console.log("Admin access granted");
  next();
};
