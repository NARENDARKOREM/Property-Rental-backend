const express = require("express");
const router = express.Router();
const settingController = require("../controllers/settingController");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/create",
  adminMiddleware.isAdmin,
  settingController.createSetting
);
router.get("/", adminMiddleware.isAdmin, settingController.getSetting);
router.put(
  "/update/:id",
  adminMiddleware.isAdmin,
  settingController.updateSetting
);

module.exports = router;
