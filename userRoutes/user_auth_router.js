const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
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
  deleteUserAccount,
} = require("../userControllers/user_auth_controller");

const upload = require("../config/multer");
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
router.put("/user/basic-info/:uid", authMiddleware.isAuthenticated, updateUser);
router.delete("/user/delete/:id", deleteUser);
router.patch("/user/toggle-update", handleToggle);
router.post("/user/pro_image", upload.single("image"), uploadUserImage);
router.put("/user/delete", deleteUserAccount);

module.exports = router;
