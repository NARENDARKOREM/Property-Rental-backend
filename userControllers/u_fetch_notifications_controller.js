const { Property } = require('../models');
const TblNotification = require('../models/TblNotification');

const FetchNotifications = async (req, res) => {
    console.log("user from request*******",req.user)
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "User not found!" });
    }
    const uid = req.user.id;
    try {
        const notifications = await TblNotification.findAll({ where: { uid:uid } });

        if (!notifications.length) {
            return res.status(404).json({ message: "No notifications found!" });
        }
        return res.status(200).json({
            message: "Notifications fetched successfully!",
            notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
};


module.exports = {FetchNotifications}
