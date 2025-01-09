const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getPendingRoleChangeRequests,
  handleRoleChangeRequest,
  deleteRoleChangeRequest,
  statusRoleChangeRequest,
} = require("../controllers/RoleChangeRequest");
const { User } = require("../models");
const { default: axios } = require("axios");

router.get("/all", getPendingRoleChangeRequests);
// router.get('/all', authMiddleware.isAdminOrHost, getPendingRoleChangeRequests);
router.put("/update/:id", handleRoleChangeRequest);
router.delete("/delete/:id",  deleteRoleChangeRequest);
router.patch("/status/:id", statusRoleChangeRequest);
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