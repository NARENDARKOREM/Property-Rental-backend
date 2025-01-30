const express = require("express");
const upload = require("../config/multer");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

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

  updateOneSignalSubscription,

  getUserData,
  loginWithMobile,
  removeOneSignalId

} = require("../userControllers/user_auth_controller");

router.post("/user/signup", userRegister);
router.post("/user/signin", userLogin);
router.post("/user/googleauth", googleAuth);
router.post("/user/otplogin", otpLogin);
router.post("/user/verifyotp", verifyOtp);
router.post("/user/mobile",loginWithMobile);
router.post("/user/changerole",authMiddleware.isAuthenticated,upload.single("image"), requestRoleChange);
router.put("/user/forgotpassword",authMiddleware.isAuthenticated, forgotPassword);
router.get("/user/getalluser",adminMiddleware.isAdmin, getAllusers);
router.get("/user/count", adminMiddleware.isAdmin, getUsersCount);
router.put("/user/basic-info", authMiddleware.isAuthenticated, updateUser);
router.delete("/user/delete/:id", adminMiddleware.isAdmin,deleteUser);
router.patch("/user/toggle-update",adminMiddleware.isAdmin, handleToggle);
router.post("/user/pro_image",authMiddleware.isAuthenticated,upload.single("image"),uploadUserImage);
router.put("/user/delete", authMiddleware.isAuthenticated, deleteUserAccount);

router.put("/user/one_subscribe", authMiddleware.isAuthenticated, updateOneSignalSubscription);

router.get("/user/getData",authMiddleware.isAuthenticated,getUserData)
router.put("/user/remove_onesignal_id",authMiddleware.isAuthenticated,removeOneSignalId)


module.exports = router;  
