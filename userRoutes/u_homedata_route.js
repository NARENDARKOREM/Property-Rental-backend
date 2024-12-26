const express = require('express');
const { homeDataApi } = require('../userControllers/u_homedata_controller');

const router  = express.Router();

router.get("/", homeDataApi);

module.exports = router;