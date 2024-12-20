const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getPendingRoleChangeRequests,
  handleRoleChangeRequest,
  deleteRoleChangeRequest,
  statusRoleChangeRequest,
} = require("../controllers/RoleChangeRequest");

router.get("/all", getPendingRoleChangeRequests);
// router.get('/all', authMiddleware.isAdminOrHost, getPendingRoleChangeRequests);
router.put("/update/:id", handleRoleChangeRequest);
router.delete("/delete/:id",  deleteRoleChangeRequest);
router.patch("/status/:id", statusRoleChangeRequest);

module.exports = router;