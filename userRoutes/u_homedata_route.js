const express = require("express");
const { homeDataApi } = require("../userControllers/u_homedata_controller");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/", authMiddleware.optionalAuth,homeDataApi);

module.exports = router;