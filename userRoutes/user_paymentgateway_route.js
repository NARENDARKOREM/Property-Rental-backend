
const express = require("express");
const { getAllPaymentsbystatus } = require("../controllers/paymentListController");
const router = express.Router();


router.get("/all", getAllPaymentsbystatus);

module.exports = router;