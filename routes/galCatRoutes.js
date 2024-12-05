const express = require('express');
const router = express.Router();
const galCatController = require('../controllers/galCatController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.post('/upsert', isAuthenticated, isAdmin, galCatController.upsertGalCat);
router.get('/', isAuthenticated, galCatController.getAllGalCats);
router.get('/:id', isAuthenticated, galCatController.getGalCatById);
router.delete('/delete/:id', isAuthenticated, isAdmin, galCatController.deleteGalCat);

module.exports = router;
