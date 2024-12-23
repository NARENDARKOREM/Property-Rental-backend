const express = require("express");
const router = express.Router();
const extraImgController = require("../userControllers/u_extra_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/all",
//   authMiddleware.isAuthenticated,
  extraImgController.getAllExtraImg
);
router.post("/upsert",
    // authMiddleware.isAuthenticated,
    extraImgController.addEditExtraImg
)

module.exports = router;
