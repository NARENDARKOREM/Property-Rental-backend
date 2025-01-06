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

module.exports = { checkDateAvailability};
