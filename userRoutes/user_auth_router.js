const express = require("express");
const {
  userRegister,
  userLogin,
  requestRoleChange,
  forgotPassword,
  getAllusers,
  getUsersCount,
  updateUser,
  deleteUser,
} = require("../userControllers/user_auth_controller");
const router = express.Router();

router.post("/user/signup", userRegister);
router.post("/user/signin", userLogin);
router.post("/user/changerole", requestRoleChange);
router.put("/user/forgotpassword", forgotPassword);
router.get("/user/getalluser", getAllusers);
router.get("/user/count", getUsersCount);
router.put("/user/update/:id", updateUser);
router.delete("/user/delete/:id", deleteUser);

module.exports = router;
