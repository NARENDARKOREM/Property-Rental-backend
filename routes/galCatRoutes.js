const express = require('express');
const router = express.Router();
const galCatController = require('../controllers/galCatController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert',  galCatController.upsertGalCat);
router.get('/all',   galCatController.getAllGalCats);
router.get('/count',   galCatController.getGalCatCount);
router.get('/:id',   galCatController.getGalCatById);

router.delete('/delete/:id', adminMiddleware.isAdmin, galCatController.deleteGalCat);



module.exports = router;
