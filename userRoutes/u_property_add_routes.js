const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post(
  "/add",
  authMiddleware.isAuthenticated,
  propertyController.upsertProperty
);

module.exports = router;
