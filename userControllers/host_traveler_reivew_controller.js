const HostTravelerReview = require("../models/HostTravelerReview");
const User = require("../models/User");
const TblBook = require("../models/TblBook");
const { Property } = require("../models");

const hostTravelerReview = async (req, res) => {
  const uid = req.user.id;
  const { bookingId, review, rating } = req.body;
  if (!bookingId || !review || !rating) {
    return res(400).json({
      ResponseCode: "400",
      Result: "false",
      message: "Invalid Input Data!",
    });
  }
  try {
    const booking = await TblBook.findOne({
      where: {
        id: bookingId,
        book_status: "Completed",
      },
      include: [
        {
          model: Property,
          as: "properties",
          attributes: ["id", "add_user_id"],
        },
        {
          model: User,
          as: "User",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!booking) {
      return res(400).json({
        ResponseCode: "400",
        Result: "false",
        message: "Booking not found! or not Completed.",
      });
    }

    if (booking.properties.add_user_id !== uid) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "You are not authorized to review this booking!",
      });
    }
    const existingReview = await HostTravelerReview.findOne({
      where: { booking_id: bookingId },
    });

    if (existingReview) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "You have already reviewed this traveler for this stay!",
      });
    }

    await HostTravelerReview.create({
      host_id: uid,
      traveler_id: booking.User.id,
      booking_id: bookingId,
      rating,
      review,
    });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Review submitted successfully!",
    });
  } catch (error) {
    console.error("Error submitting traveler review:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message,
      stack: error.stack,
    });
  }
};

module.exports = { hostTravelerReview };
