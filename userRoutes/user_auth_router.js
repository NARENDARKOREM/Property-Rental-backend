const express = require("express");
const { userRegister, userLogin, requestRoleChange } = require("../userControllers/user_auth_controller");
const router = express.Router();

router.post("/user/signup", userRegister );
router.post("/user/signin", userLogin );
router.post("/user/changerole", requestRoleChange );

module.exports = router;