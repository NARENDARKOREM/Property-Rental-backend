const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', authMiddleware.isAdminOrHost, pagesController.upsertPage);
router.get('/all', authMiddleware.isAuthenticated, pagesController.getAllPages);
router.get('/:id', authMiddleware.isAuthenticated, pagesController.getPageById);
router.delete('/delete/:id', authMiddleware.isAdminOrHost, pagesController.deletePage);

module.exports = router;
