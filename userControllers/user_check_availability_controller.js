const { Op } = require("sequelize");
const TblBook = require("../models/TblBook");
const { User, Property } = require("../models");
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
        ResponseMsg: "Invalid Fields!",
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
      include: [
        {
          model: Property,
          as: "properties",
          attributes: [
            "id",
            "title",
            "facility",
            "ptype",
            "price",
            "address",
            "rate",
          ],
        },
      ],
    });

    const property = await Property.findAll({
      where: { id: pro_id },
    });

    if (!property) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Property Not Found!",
      });
    }

    if (existingBookings.length > 0) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "That Date Range Already Booked!",
        // existingBookings: existingBookings.map((booking) => ({
        //   bookingId: booking.id,
        //   check_in: booking.check_in,
        //   check_out: booking.check_out,
        //   book_status: booking.book_status,
        //   property: booking.properties,
        // })),
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "That Date Range Available!",
      property: property,
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
  console.log("User Details: ", uid, book_id);
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

// Check-In Controller
const checkIn = async (req, res) => {
  const uid = req.user.id;

  if (!uid) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User Not Found!",
    });
  }

  const { book_id } = req.body;

  if (!book_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Booking Not Found!",
    });
  }

  try {
    // Find the booking with the provided details
    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        add_user_id: uid,
        book_status: "Confirmed",
      },
      include: [
        {
          model: Property,
          as: "properties",
          attributes: [
            "id",
            "title",
            "facility",
            "ptype",
            "price",
            "address",
            "rate",
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Property Confirmed First Required!!",
      });
    }

    // Update booking status to "Check_in" and set the check-in time
    booking.book_status = "Check_in";
    booking.check_intime = new Date();
    await booking.save();

    // Fetch user details
    const user = await User.findByPk(booking.add_user_id);

    // Send Firebase Notification
    const message = {
      notification: {
        title: "Check In Successfully!!",
        body: `${user.name}, Your Booking #${book_id} Has Been Check In Successfully.`,
      },
      data: {
        order_id: `${book_id}`,
        type: "normal",
      },
      topic: `user_${uid}`, // Use topic-based messaging for specific users
    };

    await admin.messaging().send(message);

    // Log notification in the database
    await TblNotification.create({
      uid,
      datetime: new Date(),
      title: "Check In Successfully!!",
      description: `Booking #${book_id} Has Been Check In Successfully.`,
    });

    // Return booking and property details
    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Check In Successfully!",
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        book_status: booking.book_status,
        check_intime: booking.check_intime,
        property: booking.properties,
      },
    });
  } catch (error) {
    console.error("Error during check-in:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const checkOut = async (req, res) => {
  const uid = req.user.id;

  if (!uid) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User Not Found!",
    });
  }

  const { book_id } = req.body;

  if (!book_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Booking Not Found!",
    });
  }

  try {
    // Check if booking exists with status 'Check_in'
    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        add_user_id: uid,
        book_status: "Check_in",
      },
      include: [
        {
          model: Property,
          as: "properties",
          attributes: [
            "id",
            "title",
            "facility",
            "ptype",
            "price",
            "address",
            "rate",
          ],
        },
      ],
    });

    if (!booking) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Property Check In First Required!!",
      });
    }

    // Update booking status to 'Completed' and set check-out time
    booking.book_status = "Completed";
    booking.check_outtime = new Date();
    await booking.save();

    // Fetch user details
    const user = await User.findByPk(uid);

    // Send Firebase Notification
    const message = {
      notification: {
        title: "Check Out Successfully!!",
        body: `${user.name}, Your Booking #${book_id} Has Been Checked Out Successfully.`,
      },
      data: {
        order_id: `${book_id}`,
        type: "normal",
      },
      topic: `user_${uid}`,
    };

    await admin.messaging().send(message);

    // Log notification in the database
    await TblNotification.create({
      uid,
      datetime: new Date(),
      title: "Check Out Successfully!!",
      description: `Booking #${book_id} Has Been Checked Out Successfully.`,
    });

    // Return booking and property details
    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Check Out Successfully!",
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        book_status: booking.book_status,
        check_outtime: booking.check_outtime,
        property: booking.properties, // Include property details
      },
    });
  } catch (error) {
    console.error("Error during check-out:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

module.exports = { checkDateAvailability, confirmBooking, checkIn, checkOut };
