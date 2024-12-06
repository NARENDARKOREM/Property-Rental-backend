const express = require('express');
const router = express.Router();
const galCatController = require('../controllers/galCatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/upsert', authMiddleware.isAdminOrHost, galCatController.upsertGalCat);
router.get('/',  authMiddleware.isAuthenticated, galCatController.getAllGalCats);
router.get('/:id',  authMiddleware.isAuthenticated, galCatController.getGalCatById);
router.delete('/delete/:id', authMiddleware.isAdminOrHost, galCatController.deleteGalCat);

module.exports = router;
