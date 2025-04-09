const { Op } = require('sequelize');
const TblNotification = require('../models/TblNotification');

const FetchNotifications = async (req, res) => {
    console.log("User from request:", req.user);
  
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        ResponseCode: "401",
        ResponseMsg: "User not authenticated",
      });
    }
  
    const uid = req.user.id;
  
    try {
      const notifications = await TblNotification.findAll({
        where: { uid: uid },
        order: [['datetime', 'DESC']],
      });
  
      const hasUnread = notifications.some(notification => notification.is_read === false);
  
      return res.status(200).json({
        success: true,
        hasUnread: hasUnread ? false : true, 
        ResponseCode: "200",
        ResponseMsg: notifications.length
          ? "Notifications fetched successfully!"
          : "No notifications found",
        notifications: notifications || [],
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        ResponseCode: "500",
        ResponseMsg: "Internal Server Error",
        error: error.message,
      });
    }
  };
  

const markNotificationAsRead = async (req, res) => {
  const uid = req.user?.id;

  if (!uid) {
    return res.status(401).json({
      success: false,
      ResponseCode: "401",
      ResponseMsg: "User not authenticated",
    });
  }

  try {
    const unreadNotifications = await TblNotification.findAll({
      where: {
        uid: uid,
        is_read: false,
      },
    });

    if (!unreadNotifications || unreadNotifications.length === 0) {
      return res.status(200).json({
        success: true,
        ResponseCode: "200",
        ResponseMsg: "No unread notifications found",
        notifications: [],
      });
    }

    await TblNotification.update(
      { is_read: true },
      {
        where: {
          uid: uid,
          is_read: false,
        },
      }
    );

    const updatedNotifications = await TblNotification.findAll({
      where: { uid: uid, id: unreadNotifications.map(n => n.id) },
      order: [['datetime', 'DESC']], // Latest first
    });

    return res.status(200).json({
      success: true,
      is_read: true, // Indicates all returned notifications are now read
      ResponseCode: "200",
      ResponseMsg: "Notifications marked as read successfully",
      notifications: updatedNotifications,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({
      success: false,
      ResponseCode: "500",
      ResponseMsg: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { FetchNotifications, markNotificationAsRead };