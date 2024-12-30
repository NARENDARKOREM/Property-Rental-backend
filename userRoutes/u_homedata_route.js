const express = require('express');
const { homeDataApi } = require('../userControllers/u_homedata_controller');

const router  = express.Router();

router.post("/", homeDataApi);

module.exports = router;