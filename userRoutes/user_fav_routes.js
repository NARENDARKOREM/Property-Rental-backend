const express = require("express");
const router = express.Router();
const favoritesController = require("../userControllers/user_fav_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post(
  "/toggle-favorite",

  favoritesController.toggleFavorite
);
router.post(
  "/get-favorite-list",

  favoritesController.getFavoriteList
);

module.exports = router;
