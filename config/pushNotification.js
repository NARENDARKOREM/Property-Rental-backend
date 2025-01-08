const { User } = require("../models");

const sendPushNotification = async (uid, newBooking) => {
    try {
      
      const user = await User.findOne({ where: { id: uid }, attributes: ["name", "subscription_id"] });
  
      if (!user || !user.subscription_id) {
        console.error("User or subscription ID not found");
        return { success: false, message: "User or subscription ID not found" };
      }
  
      const notificationContent = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_subscription_ids: [user.subscription_id], 
        data: { order_id: newBooking.id, type: "normal" },
        contents: { en: `${user.name}, Your Booking #${newBooking.id} Has Been Received.` },
        headings: { en: "Booking Received!!" },
      };
  
      // Send the notification via OneSignal
      const response = await axios.post("https://onesignal.com/api/v1/notifications", notificationContent, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        },
      });
  
      console.log("Notification sent successfully:", response.data);
      return { success: true, message: "Notification sent successfully", data: response.data };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false, message: "Error sending notification", error: error.message };
    }
  };

  module.exports = sendPushNotification;