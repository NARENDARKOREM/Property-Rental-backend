const express = require('express');
const router = express.Router();
const { addToFavorites, getFavoriteProperties, removeFromFavorites } = require('../controllers/favController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.post('/add', isAuthenticated, addToFavorites);
router.get('/', isAuthenticated, getFavoriteProperties);
router.delete('/remove/:id', isAuthenticated, removeFromFavorites);

module.exports = router;
