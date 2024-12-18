const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getPendingRoleChangeRequests,
  handleRoleChangeRequest,
  deleteRoleChangeRequest,
} = require("../controllers/RoleChangeRequest");

router.get("/all", getPendingRoleChangeRequests);
// router.get('/all', authMiddleware.isAdminOrHost, getPendingRoleChangeRequests);
router.put("/update/:id", handleRoleChangeRequest);
router.delete("/delete/:id", adminMiddleware.isAdmin, deleteRoleChangeRequest);

module.exports = router;