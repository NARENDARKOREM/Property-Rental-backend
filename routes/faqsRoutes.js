const express = require('express');
const router = express.Router();
const faqsController = require('../controllers/faqsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', adminMiddleware.isAdmin, faqsController.upsertFaq);
router.get('/all', authMiddleware.isAuthenticated, faqsController.getAllFaqs);
router.get('/:id',authMiddleware.isAuthenticated, faqsController.getFaqById);
router.delete('/delete/:id', adminMiddleware.isAdmin, faqsController.deleteFaq);


module.exports = router;
