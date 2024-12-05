const TblNotification = require('../models/TblNotification');
const User = require('../models/User');

// Request to Become Host
const requestHost = async (req, res) => {
    const uid = req.user.id; // Get the user ID from the authenticated user

    try {
        // Create a notification for admin
        const adminNotification = await TblNotification.create({
            uid: 1, // Assuming admin ID is 1 (update as per your admin ID or logic)
            datetime: new Date(),
            title: 'Host Request',
            description: `User ID ${uid} has requested to become a host.`
        });

        // Create a notification for the user
        const userNotification = await TblNotification.create({
            uid,
            datetime: new Date(),
            title: 'Host Request Sent',
            description: `Your request to become a host has been sent to the admin.`
        });

        res.status(201).json({ message: 'Host request sent successfully', adminNotification, userNotification });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Notifications for User or Admin
const getNotifications = async (req, res) => {
    const uid = req.user.id;

    try {
        const notifications = await TblNotification.findAll({ where: { uid } });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Handle Host Request (Accept/Decline)
const handleHostRequest = async (req, res) => {
    const { notificationId, action } = req.body; // action can be 'accept' or 'decline'
    const adminId = req.user.id; // Get the admin ID from the authenticated user

    try {
        const notification = await TblNotification.findOne({ where: { id: notificationId, uid: adminId } });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const userId = notification.description.match(/\d+/)[0]; // Extract user ID from the description

        if (action === 'accept') {
            // Update user role to host
            const user = await User.findByPk(userId);
            user.role = 'host';
            await user.save();

            // Create notification for user
            await TblNotification.create({
                uid: userId,
                datetime: new Date(),
                title: 'Host Request Accepted',
                description: `Your request to become a host has been accepted by the admin.`
            });

            res.status(200).json({ message: 'Host request accepted successfully', user });
        } else if (action === 'decline') {
            // Create notification for user
            await TblNotification.create({
                uid: userId,
                datetime: new Date(),
                title: 'Host Request Declined',
                description: `Your request to become a host has been declined by the admin.`
            });

            res.status(200).json({ message: 'Host request declined successfully' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    requestHost,
    getNotifications,
    handleHostRequest
};
