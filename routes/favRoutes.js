const express = require('express');
const router = express.Router();
const { addToFavorites, getFavoriteProperties, removeFromFavorites } = require('../controllers/favController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/add',  authMiddleware.isAuthenticated, addToFavorites);
router.get('/',  authMiddleware.isAuthenticated, getFavoriteProperties);
router.delete('/remove/:id',  authMiddleware.isAuthenticated, removeFromFavorites);

module.exports = router;
