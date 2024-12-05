const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/upsert', authMiddleware.isAdminOrHost, propertyController.upsertProperty);
router.get('/', authMiddleware.isAuthenticated, propertyController.getAllProperties);
router.get('/:id',authMiddleware.isAuthenticated, propertyController.getPropertyById);
router.delete('/delete/:id', authMiddleware.isAdminOrHost, propertyController.deleteProperty);

module.exports = router;
