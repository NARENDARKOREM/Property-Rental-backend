const { Op } = require("sequelize");
const TblBook = require("../models/TblBook");
const { User } = require("../models");
const admin = require("firebase-admin"); // Import Firebase Admin SDK
const TblNotification = require("../models/TblNotification");

// Check Date Availability
const checkDateAvailability = async (req, res) => {
  try {
    const { pro_id, check_in, check_out } = req.body;

    if (!pro_id || !check_in || !check_out) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Something Went Wrong!",
      });
    }

    const existingBookings = await TblBook.findAll({
      where: {
        prop_id: pro_id,
        book_status: { [Op.ne]: "Cancelled" },
        [Op.or]: [
          {
            check_in: {
              [Op.between]: [check_in, check_out],
            },
          },
          {
            check_out: {
              [Op.between]: [check_in, check_out],
            },
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "That Date Range Already Booked!",
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "That Date Range Available!",
    });
  } catch (error) {
    console.error("Error checking date availability:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

// Confirm Booking
const confirmBooking = async (req, res) => {
  const { uid, book_id } = req.body;

  if (!uid || !book_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Check if the booking exists with status 'Booked'
    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        add_user_id: uid,
        book_status: "Booked",
      },
    });

    if (!booking) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Property Booked Status First Required!!",
      });
    }

    // Update booking status to 'Confirmed'
    booking.book_status = "Confirmed";
    await booking.save();

    // Fetch user details for notification
    const user = await User.findByPk(uid);

    // Send Firebase Notification
    const message = {
      notification: {
        title: "Confirmed Successfully!!",
        body: `${user.name}, Your Booking #${book_id} Has Been Confirmed Successfully.`,
      },
      data: {
        order_id: `${book_id}`,
        type: "normal",
      },
      topic: `user_${uid}`, // Use topic-based messaging for specific users
    };

    await admin.messaging().send(message); // Send the notification

    // Log the notification in the database
    await TblNotification.create({
      uid,
      datetime: new Date(),
      title: "Confirmed Successfully!!",
      description: `Booking #${book_id} Has Been Confirmed Successfully.`,
    });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Booking Confirmed Successfully!",
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

module.exports = { checkDateAvailability, confirmBooking };
