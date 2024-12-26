const express = require("express");
const router = express.Router();
const extraImgController = require("../userControllers/u_extra_controller");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");

router.post(
  "/add-extra",
  authMiddleware.isAuthenticated,
  upload.array("img"),
  extraImgController.addExtraImages
);

router.put(
  "/update/:extra_id",
  authMiddleware.isAuthenticated,
  upload.array("img"),
  extraImgController.editExtraImages
);

router.get(
  "/extra-images/{uid}",
  // authMiddleware.isAuthenticated,
  extraImgController.getExtraImages
);

module.exports = router;
