const express = require("express");
const router = express.Router();
const faqsController = require("../controllers/faqsController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post("/upsert", adminMiddleware.isAdmin, faqsController.upsertFaq);
router.get("/all",adminMiddleware.isAdmin, faqsController.getAllFaqs);
router.get("/count",adminMiddleware.isAdmin, faqsController.getFaqCount);
router.get("/:id",adminMiddleware.isAdmin, faqsController.getFaqById);
router.delete("/delete/:id",adminMiddleware.isAdmin, faqsController.deleteFaq);
router.patch("/toggle-status",adminMiddleware.isAdmin, faqsController.toggleFaqStatus);
module.exports = router;
