const express = require("express");
const { userRegister, userLogin, requestRoleChange, forgotPassword, getAllusers } = require("../userControllers/user_auth_controller");
const router = express.Router();

router.post("/user/signup", userRegister );
router.post("/user/signin", userLogin );
router.post("/user/changerole", requestRoleChange );
router.put("/user/forgotpassword", forgotPassword );
router.get("/user/getalluser", getAllusers );

module.exports = router;