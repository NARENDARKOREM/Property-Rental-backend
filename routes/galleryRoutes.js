const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');






router.post('/upsert', adminMiddleware.isAdmin,  galleryController.upsertGallery);
router.get('/all',  galleryController.getAllGalleries);
router.get('/:id', galleryController.getGalleryById);
router.delete('/delete/:id', adminMiddleware.isAdmin, galleryController.deleteGallery);



module.exports = router;
