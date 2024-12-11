const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert',  pagesController.upsertPage);
router.get('/all', pagesController.getAllPages);
router.get('/:id',  pagesController.getPageById);
router.delete('/delete/:id', pagesController.deletePage);

module.exports = router;
