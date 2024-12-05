const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.post('/upsert', isAuthenticated, isAdmin, propertyController.upsertProperty);
router.get('/', isAuthenticated, propertyController.getAllProperties);
router.get('/:id', isAuthenticated, propertyController.getPropertyById);
router.delete('/delete/:id', isAuthenticated, isAdmin, propertyController.deleteProperty);

module.exports = router;
