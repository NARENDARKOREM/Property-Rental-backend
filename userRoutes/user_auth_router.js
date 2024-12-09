const express = require("express");
const { userRegister, userLogin, requestRoleChange, forgotPassword } = require("../userControllers/user_auth_controller");
const router = express.Router();

router.post("/user/signup", userRegister );
router.post("/user/signin", userLogin );
router.post("/user/changerole", requestRoleChange );
router.put("/user/forgotpassword", forgotPassword );

module.exports = router;