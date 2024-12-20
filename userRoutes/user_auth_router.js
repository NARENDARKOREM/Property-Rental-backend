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
  googleAuth,
  handleToggle,
  otpLogin,
  verifyOtp,
  uploadUserImage,
} = require("../userControllers/user_auth_controller");
const router = express.Router();

router.post("/user/signup", userRegister);
router.post("/user/signin", userLogin);
router.post("/user/googleauth", googleAuth);
router.post("/user/otplogin", otpLogin);
router.post("/user/verifyotp", verifyOtp);
router.post("/user/changerole", requestRoleChange);
router.put("/user/forgotpassword", forgotPassword);
router.get("/user/getalluser", getAllusers);
router.get("/user/count", getUsersCount);
router.put("/user/update/:id", updateUser);
router.delete("/user/delete/:id", deleteUser);
router.patch("/user/toggle-update", handleToggle);
router.post("/user/pro_image", uploadUserImage);

module.exports = router;
