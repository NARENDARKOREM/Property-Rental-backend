const express = require('express');
const router = express.Router();
const galCatController = require('../controllers/galCatController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', adminMiddleware.isAdmin, galCatController.upsertGalCat);
router.get('/',  authMiddleware.isAuthenticated, galCatController.getAllGalCats);
router.get('/:id',  authMiddleware.isAuthenticated, galCatController.getGalCatById);
router.delete('/delete/:id', adminMiddleware.isAdmin, galCatController.deleteGalCat);

module.exports = router;
