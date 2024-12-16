const express = require('express');
const router = express.Router();
const faqsController = require('../controllers/faqsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', adminMiddleware.isAdmin, faqsController.upsertFaq);
router.get('/all',  faqsController.getAllFaqs);
router.get('/count',  faqsController.getFaqCount);
router.get('/:id', faqsController.getFaqById);
router.delete('/delete/:id',faqsController.deleteFaq);

module.exports = router;
