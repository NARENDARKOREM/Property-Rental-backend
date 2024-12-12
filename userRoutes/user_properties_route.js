const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert',   propertyController.upsertProperty);
router.get('/',  authMiddleware.isAuthenticated, propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);
router.delete('/delete/:id',  propertyController.deleteProperty);

module.exports = router;