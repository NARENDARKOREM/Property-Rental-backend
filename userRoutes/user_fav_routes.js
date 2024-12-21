const express = require("express");
const router = express.Router();
const favoritesController = require("../userControllers/user_fav_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post(
  "/toggle-favorite",
  authMiddleware.isAuthenticated,
  favoritesController.toggleFavorite
);
router.post(
  "/get-favorite-list",
  authMiddleware.isAuthenticated,
  favoritesController.getFavoriteList
);

module.exports = router;
