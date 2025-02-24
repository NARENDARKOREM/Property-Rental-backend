const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware')

const {
  getPendingRoleChangeRequests,
  handleRoleChangeRequest,
  deleteRoleChangeRequest,
  statusRoleChangeRequest,
  ViewRoleChangeRequst,
} = require("../controllers/RoleChangeRequest");
const { User } = require("../models");
const { default: axios } = require("axios");

router.get("/all",adminMiddleware.isAdmin, getPendingRoleChangeRequests);
// router.get('/all', authMiddleware.isAdminOrHost, getPendingRoleChangeRequests);
router.put("/update/:id",adminMiddleware.isAdmin, handleRoleChangeRequest);
router.delete("/delete/:id",adminMiddleware.isAdmin,  deleteRoleChangeRequest);
router.patch("/status/:id",adminMiddleware.isAdmin, statusRoleChangeRequest);
router.get("/request/:id",adminMiddleware.isAdmin,ViewRoleChangeRequst)
// router.post("/test",authMiddleware.isAuthenticated, async (req, res)=>{

  
// const userId = req.user.id
//   try {

//     const user = await User.findByPk(userId);

//     console.log(user, "from userrrrrrrrrrrrrrrr");


     
//     const notificationContent = {
//       app_id: process.env.ONESIGNAL_APP_ID,
//       include_player_ids: [user.one_subscription], 
//       data: { user_id: user.id, type: "role_change" },
//       contents: { en: `${user.name}, Your role change to '${user.role}' has been approved.` },
//       headings: { en: "Role Change Approved!" },
//     };

//     const response = await axios.post("https://onesignal.com/api/v1/notifications", notificationContent, {
//       headers: {
//         "Content-Type": "application/json; charset=utf-8",
//         Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
//       },
//     });

//     console.log("Notification sent successfully:", response.data);
//   } catch (error) {
//     console.error("Error sending notification:", error.message);
//   }
// });


module.exports = router;