const express = require("express");
const router = express.Router();
const faqController = require("../userControllers/u_faq_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/all",faqController.faqList);

module.exports = router;
