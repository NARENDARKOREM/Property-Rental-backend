const { Property, User } = require('../models');
const TblBook = require('../models/TblBook');
const axios = require('axios');
const TblNotification = require('../models/TblNotification');
require('dotenv').config();

const travelerBookingAmountRefund = async (req, res) => {
    try {
        const uid = req.user?.id;
        if (!uid) {
            return res.status(401).json({ message: "User not found!" });
        }

        const { transaction_id, notes, amount, book_id } = req.body;

        if (!transaction_id) return res.status(400).json({ message: "Transaction ID is required!" });
        if (!book_id) return res.status(400).json({ message: "Book ID is required!" });
        if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ message: "Valid refund amount is required!" });

        // Convert amount to paise (Razorpay requires amount in paise)
        const refundAmount = Math.round(amount * 100);

        const KEY_ID = process.env.RAZORPAY_KEY_ID;
        const SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;
        const URL = `https://api.razorpay.com/v1/payments/${transaction_id}/refund`;

        console.log("RAZORPAY_KEY_ID:", KEY_ID);
        console.log("RAZORPAY_SECRET_KEY:", SECRET_KEY);

        const booking = await TblBook.findOne({
            where: { id: book_id, uid: uid, transaction_id, book_status: "Confirmed" }
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found or not eligible for refund!" });
        }

        if (["Pending", "Processed"].includes(booking.refund_status)) {
            return res.status(400).json({ message: "Refund has already been initiated for this booking!" });
        }

        const property = await Property.findOne({ where: { id: booking.prop_id } });
        if (!property) {
            return res.status(404).json({ message: "Property not found!" });
        }

        const user = await User.findByPk(uid);

        await booking.update({ refund_status: "Pending" });

        const response = await axios.post(
            URL,
            {
                amount: refundAmount,
                notes: typeof notes === 'object' ? notes : { refund_reason: notes || "No reason provided" }
            },
            {
                auth: { username: KEY_ID, password: SECRET_KEY },
                headers: { 'Content-Type': 'application/json' }
            }
        );

        let host = null;
        if (property.add_user_id) {
            host = await User.findByPk(property.add_user_id);
        }

        // Send OneSignal notifications
        try {
            if (host && host.one_subscription) {
                await axios.post(
                    "https://onesignal.com/api/v1/notifications",
                    {
                        app_id: process.env.ONESIGNAL_APP_ID,
                        include_player_ids: [host.one_subscription],
                        data: { user_id: user.id, type: "amount_refund" },
                        contents: {
                            en: `A refund has been initiated for ${booking.prop_title}. Booking ID: ${booking.id}.`
                        },
                        headings: { en: "Refund Initiated!" },
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                        },
                    }
                );
            }

            if (user.one_subscription) {
                await axios.post(
                    "https://onesignal.com/api/v1/notifications",
                    {
                        app_id: process.env.ONESIGNAL_APP_ID,
                        include_player_ids: [user.one_subscription],
                        data: { user_id: user.id, type: "booking_refund" },
                        contents: {
                            en: `Your refund for ${booking.prop_title} has been initiated. Booking ID: ${booking.id}.`
                        },
                        headings: { en: "Refund Initiated!" },
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                        },
                    }
                );
            }
        } catch (error) {
            console.log("Error sending notifications:", error.message);
        }

        await TblNotification.create({
            uid: uid,
            datetime: new Date(),
            title: "Refund Initiated!",
            description: `Your refund for ${booking.prop_title} has been initiated. Booking ID: ${booking.id}.`,
        });

        if (host) {
            await TblNotification.create({
                uid: host.id,
                datetime: new Date(),
                title: "Refund Initiated!",
                description: `A refund has been initiated for ${booking.prop_title}. Booking ID: ${booking.id}.`,
            });
        }

        await booking.update({ refund_status: "Processed" });

        return res.status(200).json({
            message: "Refund initiated successfully",
            refund_details: response.data
        });

    } catch (error) {
        console.error("Error processing refund:", error.response?.data || error.message);
        if (req.body.book_id) {
            await TblBook.update({ refund_status: "Failed" }, { where: { id: req.body.book_id } });
        }

        return res.status(500).json({
            message: "Failed to process refund",
            error: error.response?.data || error.message
        });
    }
};

module.exports = { travelerBookingAmountRefund };
