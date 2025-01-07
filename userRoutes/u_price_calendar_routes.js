const express =  require('express');
const router = express.Router();
const priceCalendarController = require('../userControllers/u_price_calendar_controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/add-price", authMiddleware.isAuthenticated, priceCalendarController.addPriceCalendar);

module.exports = router;