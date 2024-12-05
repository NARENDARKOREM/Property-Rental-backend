const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { getPendingRoleChangeRequests, handleRoleChangeRequest } = require('../controllers/RoleChangeRequest');



router.get('/all',  getPendingRoleChangeRequests);
// router.get('/all', authMiddleware.isAdminOrHost, getPendingRoleChangeRequests);
router.put('/update/:id',  handleRoleChangeRequest);

module.exports = router;