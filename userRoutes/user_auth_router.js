const express = require("express");
const { userRegister, userLogin } = require("../userControllers/user_auth_controller");
const router = express.Router();

router.post("/user/signup", userRegister );
router.post("/user/signin", userLogin );

module.exports = router;