const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', authMiddleware.isAuthenticated, pagesController.upsertPage);
router.get('/all', authMiddleware.isAuthenticated, pagesController.getAllPages);
router.get('/:id', authMiddleware.isAuthenticated, pagesController.getPageById);
router.delete('/delete/:id', authMiddleware.isAuthenticated, pagesController.deletePage);

module.exports = router;
