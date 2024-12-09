const express = require('express');
const router = express.Router();
const personRecordController = require('../controllers/personRecordController');
const authMiddleware = require('../middlewares/authMiddleware');

// Fetch current user's person records
router.get('/person-records', authMiddleware.isAuthenticated, personRecordController.getPersonRecordsByUser);
router.post('/upsert', authMiddleware.isAuthenticated, personRecordController.upsertPersonRecord);

module.exports = router;
