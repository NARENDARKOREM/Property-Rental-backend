const express = require("express");
const router = express.Router();
const extraImgController = require("../userControllers/u_extra_controller");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multer");

router.post(
  "/add-extra",
  authMiddleware.isAuthenticated,
  upload.array("images"),
  extraImgController.addExtraImages
);

router.put(
  "/update/:extra_id",
  authMiddleware.isAuthenticated,
  upload.array("images"),
  extraImgController.editExtraImages
);

router.get(
  "/extra-images",
  authMiddleware.isAuthenticated,
  extraImgController.getExtraImages
);

router.delete("/delete-extra-image", authMiddleware.isAuthenticated, extraImgController.deleteExtraImage)

module.exports = router;
