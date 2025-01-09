const User = require("../models/User");
const PersonRecord = require("../models/PersonRecord");
const TblBook = require("../models/TblBook");
const Property = require("../models/Property");
const { Op, or, where } = require("sequelize");
// const { sendResponse } = require("../utils");
const PaymentList = require("../models/PaymentList");
const TblNotification = require("../models/TblNotification");

const sendResponse = (res, code, result, msg, additionalData = {}) => {
  res.status(code).json({
    ResponseCode: code,
    Result: result,
    ResponseMsg: msg,
    ...additionalData,
  });
};

const createBooking = async (req, res) => {
  const uid = req.user.id;
  const {
    prop_id,
    check_in,
    check_out,
    subtotal,
    total,
    tax,
    p_method_id,
    book_for,
    prop_price,
    total_day,
    add_note,
    transaction_id,
    cou_amt = 0,
    noguest,
    fname,
    lname,
    gender,
    email,
    mobile,
    ccode,
    country,
    adults,
    children,
    infants,
    pets,
  } = req.body;

  if (
    !prop_id ||
    !check_in ||
    !check_out ||
    !subtotal ||
    !total ||
    !tax ||
    !p_method_id ||
    !book_for ||
    !prop_price
  ) {
    return res
      .status(401)
      .json({ success: false, message: "Something Went Wrong!" });
  }

  if (book_for === "other") {
    if (
      !fname ||
      !lname ||
      !gender ||
      !email ||
      !mobile ||
      !ccode ||
      !country
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required when booking for someone else. Please provide first name, last name, gender, email, mobile, country code, and country.",
      });
    }
  }

  try {
    const user = await User.findByPk(uid);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User Not Found!" });
    }

    const property = await Property.findOne({
      where: { id: prop_id, status: 1 },
    });
    if (!property) {
      return res
        .status(401)
        .json({ success: false, message: "Property Not Found!" });
    }

    if (
      adults > property.adults ||
      children > property.children ||
      infants > property.infants ||
      pets > property.pets
    ) {
      return res.status(401).json({
        success: false,
        message: `Guests limit exceeded! Adults: ${property.adults}, Children: ${property.children}, Infants: ${property.infants}, Pets: ${property.pets}`,
      });
    }

    const existingBookings = await TblBook.findOne({
      where: {
        prop_id,
        book_status: { [Op.ne]: "Cancelled" },
        [Op.or]: [
          { check_in: { [Op.between]: [check_in, check_out] } },
          { check_out: { [Op.between]: [check_in, check_out] } },
        ],
      },
    });

    if (existingBookings) {
      return res
        .status(401)
        .json({ success: false, message: "That Date Range Already Booked!" });
    }

    const bookingData = {
      prop_id,
      uid,
      check_in,
      check_out,
      subtotal,
      total,
      tax,
      p_method_id,
      book_for,
      prop_price,
      total_day,
      book_date: new Date(),
      add_note,
      transaction_id,
      cou_amt,
      prop_title: property.title,
      prop_img: property.image,
      add_user_id: property.add_user_id,
      noguest,
      adults,
      children,
      infants,
      pets,
      book_status: "Booked",
    };

    const booking = await TblBook.create(bookingData);

    if (book_for === "other") {
      await PersonRecord.create({
        fname,
        lname,
        gender,
        email,
        mobile,
        ccode,
        country,
        book_id: booking.id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking Booked Successfully!!!",
      data: {
        book_id: booking.id,
        booking_details: booking,
        property_details: property,
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};

const confirmBooking = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }
  const { book_id } = req.body;
  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Booked" },
    });
    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found or already confirmed!"
      );
    }
    booking.book_status = "Confirmed";
    await booking.save();
    const user = await User.findByPk(uid);

    // Send push notification or email (update the notification logic as required)
    const message = {
      notification: {
        title: "Booking Confirmed",
        body: `${user.name}, Your booking for ${booking.prop_title} has been confirmed! Your Booking ID is ${booking.id}`,
      },
      data: {
        order_id: booking.id,
        type: "booking",
      },
      topic: `booking_${uid}`,
    };

    // Create a notification record in the database
    await TblNotification.create({
      uid: uid,
      datetime: new Date(),
      title: "Booking Confirmed",
      description: `Your booking for ${booking.prop_title} has been confirmed! Your Booking ID is ${booking.id}`,
    });

    // Return success response
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

// Get Booking Details (both self)
const getBookingDetails = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }
  const { book_id } = req.body;

  const user = await User.findByPk(uid);
  if (!user) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }

  // Validation
  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid },
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found or you do not have access to this booking!"
      );
    }

    const fp = {
      book_id: booking.id,
      prop_id: booking.prop_id,
      prop_title: booking.prop_title,
      uid: booking.uid,
      book_date: booking.book_date,
      check_in: booking.check_in,
      check_out: booking.check_out,
      payment_title: "",
      subtotal: booking.subtotal,
      total: booking.total,
      tax: booking.tax,
      cou_amt: booking.cou_amt,
      transaction_id: booking.transaction_id,
      p_method_id: booking.p_method_id,
      add_note: booking.add_note,
      book_status: booking.book_status,
      check_intime: booking.check_intime,
      noguest: booking.noguest,
      check_outtime: booking.check_outtime,
      book_for: booking.book_for,
      is_rate: booking.is_rate,
      total_rate: booking.total_rate || "",
      rate_text: booking.rate_text || "",
      prop_price: booking.prop_price,
      total_day: booking.total_day,
      cancle_reason: booking.cancle_reason || "",
    };

    // Fetch payment method title
    if (booking.p_method_id) {
      const payment = await PaymentList.findOne({
        where: { id: booking.p_method_id },
      });
      if (payment) {
        fp.payment_title = payment.title;
      }
    }

    // If booking is for another person, fetch their details
    if (booking.book_for === "other") {
      const personDetails = await PersonRecord.findOne({
        where: { book_id },
      });

      if (personDetails) {
        fp.fname = personDetails.fname;
        fp.lname = personDetails.lname;
        fp.gender = personDetails.gender;
        fp.email = personDetails.email;
        fp.mobile = personDetails.mobile;
        fp.ccode = personDetails.ccode;
        fp.country = personDetails.country;
      } else {
        fp.fname = "";
        fp.lname = "";
        fp.gender = "";
        fp.email = "";
        fp.mobile = "";
        fp.ccode = "";
        fp.country = "";
      }
    } else {
      fp.fname = "";
      fp.lname = "";
      fp.gender = "";
      fp.email = "";
      fp.mobile = "";
      fp.ccode = "";
      fp.country = "";
    }

    return sendResponse(res, 200, "true", "Book Property Details Found!", {
      bookdetails: fp,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

const userCheckIn = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id } = req.body;

  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Confirmed" },
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
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to check-in this booking!"
      );
    }

    await TblBook.update(
      { book_status: "Check_in" },
      { where: { id: book_id, uid } }
    );

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Checked In Successfully!",
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        book_status: booking.book_status,
        property: booking.properties,
      },
    });
  } catch (error) {
    console.error("Error checking in:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

const userCheckOut = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id } = req.body;

  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Check_in" },
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to check-out this booking!"
      );
    }

    await TblBook.update(
      { book_status: "Completed" },
      { where: { id: book_id, uid } }
    );

    return sendResponse(res, 200, "true", "Checked Out Successfully!");
  } catch (error) {
    console.error("Error checking out:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id, cancle_reason } = req.body;

  if (!book_id || !uid) {
    return sendResponse(res, 401, "false", "Something Went Wrong!");
  }

  const user = await User.findByPk(uid);
  if (!user) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Confirmed" },
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to cancel this booking!"
      );
    }

    await TblBook.update(
      { book_status: "Cancelled", cancle_reason },
      { where: { id: book_id, uid } }
    );

    return sendResponse(res, 200, "true", "Booking Cancelled Successfully!");
  } catch (error) {
    console.error("Error canceling booking:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// Get Bookings By its Status
const getBookingsByStatus = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }

  const { status } = req.body;

  const user = await User.findByPk(uid);
  if (!user) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }

  if (!status) {
    return sendResponse(res, 401, "false", "Missing parameters!");
  }

  try {
    let queryFilter = { uid: uid };

    if (status === "active") {
      queryFilter.book_status = { [Op.notIn]: ["Cancelled", "Completed"] };
    } else if (status === "cancelled") {
      queryFilter.book_status = { [Op.in]: ["Cancelled"] };
    } else {
      return sendResponse(res, 401, "false", "Invalid status provided!");
    }

    const bookings = await TblBook.findAll({
      where: queryFilter,
      order: [["id", "DESC"]],
    });

    const bookingDetails = [];
    for (const booking of bookings) {
      const property = await Property.findOne({
        where: {
          id: booking.prop_id,
          add_user_id: uid, // Ensure the property belongs to the logged-in user
        },
      });

      if (!property) {
        continue; // Skip bookings for properties not created by the user
      }

      let totalRate = "5";

      if (booking.book_status === "Completed") {
        const completedBookings = await TblBook.findAll({
          where: {
            prop_id: booking.prop_id,
            book_status: "Completed",
            total_rate: { [Op.ne]: 0 },
          },
        });

        if (completedBookings.length > 0) {
          const avgRate =
            completedBookings.reduce(
              (acc, b) => acc + parseFloat(b.total_rate),
              0
            ) / completedBookings.length;
          totalRate = avgRate.toFixed(0);
        }
      }

      const bookingInfo = {
        book_id: booking.id,
        prop_id: booking.prop_id,
        prop_img: booking.prop_img,
        prop_title: booking.prop_title,
        book_status: booking.book_status,
        prop_price: booking.prop_price,
        p_method_id: booking.p_method_id,
        total_day: booking.total_day,
        total_rate: totalRate,
      };

      bookingDetails.push(bookingInfo);
    }

    return sendResponse(
      res,
      200,
      "true",
      "Status Wise Property Details Found!",
      { statuswise: bookingDetails }
    );
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// After Becoming Host
const getMyUserBookings = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { status } = req.body;

  if (!status) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Validate User
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Query filter to fetch user's bookings based on status
    let queryFilter = { add_user_id: uid };

    if (status === "active") {
      queryFilter.book_status = { [Op.notIn]: ["Completed", "Cancelled"] };
    } else if (status === "inactive") {
      queryFilter.book_status = { [Op.in]: ["Completed", "Cancelled"] };
    } else {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Invalid status provided!",
      });
    }

    // Fetch bookings
    const bookings = await TblBook.findAll({
      where: queryFilter,
      order: [["id", "DESC"]],
    });

    const statuswise = [];

    for (const booking of bookings) {
      let totalRate = "5";

      // Calculate the average rating for completed bookings
      const completedBookings = await TblBook.findAll({
        where: {
          prop_id: booking.prop_id,
          book_status: "Completed",
          total_rate: { [Op.ne]: 0 },
        },
      });

      if (completedBookings.length > 0) {
        const avgRate =
          completedBookings.reduce(
            (acc, b) => acc + parseFloat(b.total_rate),
            0
          ) / completedBookings.length;
        totalRate = avgRate.toFixed(0);
      }

      statuswise.push({
        book_id: booking.id,
        prop_id: booking.prop_id,
        prop_img: booking.prop_img,
        prop_title: booking.prop_title,
        p_method_id: booking.p_method_id,
        prop_price: booking.prop_price,
        total_day: booking.total_day,
        rate: totalRate,
        book_status: booking.book_status,
      });
    }

    return res.status(200).json({
      statuswise: statuswise,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Status Wise Property Details Found!",
    });
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

// Get Booking Details (self & Others)
const getMyUserBookingDetails = async (req, res) => {
  try {
    const uid = req.user.id;
    if (!uid) {
      return sendResponse(res, 401, "false", "User Not Found!");
    }

    const user = await User.findByPk(uid);
    if (!user) {
      return sendResponse(res, 401, "false", "User Not Found!");
    }

    const { book_id } = req.query;

    if (!book_id) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Missing book_id in the query!!",
      });
    }

    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        add_user_id: uid,
      },
    });

    if (!booking) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found!",
      });
    }

    const paymentDetails = await PaymentList.findOne({
      where: {
        id: booking.p_method_id,
      },
    });

    let customerDetails = {};
    if (booking.book_for === "self") {
      const user = await User.findOne({
        where: {
          id: booking.uid,
        },
      });
      customerDetails = {
        customer_name: user.name,
        customer_mobile: user.ccode + user.mobile,
      };
    } else {
      const person = await PersonRecord.findOne({
        where: {
          book_id: booking.id,
        },
      });
      customerDetails = {
        customer_name: person.fname + " " + person.lname,
        customer_mobile: person.ccode + person.mobile,
      };
    }

    const response = {
      book_id: booking.id,
      prop_id: booking.prop_id,
      uid: booking.uid,
      book_date: booking.book_date,
      check_in: booking.check_in,
      check_out: booking.check_out,
      payment_title: paymentDetails ? paymentDetails.title : "",
      subtotal: booking.subtotal,
      total: booking.total,
      tax: booking.tax,
      cou_amt: booking.cou_amt,
      noguest: booking.noguest,
      transaction_id: booking.transaction_id,
      p_method_id: booking.p_method_id,
      add_note: booking.add_note,
      book_status: booking.book_status,
      check_intime: booking.check_intime || "",
      check_outtime: booking.check_outtime || "",
      book_for: booking.book_for,
      is_rate: booking.is_rate,
      total_rate: booking.total_rate || "",
      rate_text: booking.rate_text || "",
      prop_price: booking.prop_price,
      total_day: booking.total_day,
      cancle_reason: booking.cancle_reason || "",
      ...customerDetails,
    };

    return res.status(200).json({
      bookdetails: response,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Book Property Details Founded!",
    });
  } catch (error) {
    console.error("Error in getMyBookingDetails:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

// Cancel a Booking
const myUserCancelBookings = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id, cancle_reason } = req.body;

  // Validate input
  if (!book_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Update the booking status
    const updated = await TblBook.update(
      {
        book_status: "Cancelled",
        cancle_reason: cancle_reason || "",
      },
      {
        where: {
          id: book_id,
          add_user_id: uid,
          book_status: "Booked",
        },
      }
    );

    if (updated[0] === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found or already canceled!",
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Booking Cancelled Successfully!",
    });
  } catch (error) {
    console.error("Error canceling booking:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

// Booking Status
// const currentBookingStatus = async (req, res) => {
//   const uid = req.user?.id;

//   if (!uid) {
//     return res.status(404).json({ message: "User not found!" });
//   }

//   // Get today's date in YYYY-MM-DD format
//   const today = new Date();
//   const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//   const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//   try {
//     // Fetch bookings confirmed for today
//     const bookings = await TblBook.findAll({
//       where: {
//         uid: uid,
//         book_status: "Confirmed",
//         book_date: {
//           [Op.between]: [startOfDay, endOfDay],
//         },
//       },
//     });

//     if (bookings.length === 0) {
//       return res
//         .status(200)
//         .json({ message: "No confirmed bookings for today." });
//     }

//     res.status(200).json({
//       message: "Confirmed bookings fetched successfully!",
//       bookings: bookings,
//     });
//   } catch (error) {
//     console.error("Error fetching current booking status:", error);
//     res
//       .status(500)
//       .json({ message: "Internal Server Error", error: error.message });
//   }
// };

// const pendingBookings = async (req, res) => {
//   const uid = req.user.id;
//   if (!uid) {
//     return res.status(404).json({ message: "User not found!" });
//   }
//   try {
//     const bookings = await TblBook.findAll({
//       where: {
//         add_user_id: uid,
//         book_status: "Booked",
//       },
//       include: {
//         model: Property,
//         as: "properties",
//         add_user_id: uid,
//         attributes: [
//           "id",
//           "title",
//           "address",
//           "price",
//           "facility",
//           "rules",
//           "image",
//         ],
//       },
//     });

//     if (bookings.length === 0) {
//       return res.status(404).json({ message: "No pending bookings found!" });
//     }
//     res.status(200).json({
//       message: "Pending Bookings Fetched Successfully!",
//       bookings,
//     });
//   } catch (error) {
//     console.error("Error Fetching Pending Bookings.");
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const pastBookings = async (req, res) => {
//   const uid = req.user.id;
//   if (!uid) {
//     return res.status(401).json({ message: "User not found!" });
//   }
//   try {
//     const bookings = await TblBook.findAll({
//       where: {
//         add_user_id: uid,
//         book_status: ["Completed", "Cancelled"],
//       },
//       include: {
//         model: Property,
//         as: "properties",
//         add_user_id: uid,
//         attributes: [
//           "id",
//           "title",
//           "price",
//           "facility",
//           "rules",
//           "price",
//           "image",
//         ],
//       },
//     });
//     if (bookings.length === 0) {
//       return res.status(401).json({ message: "No Past Bookings Found!" });
//     }
//     res.status(201).json({
//       message: "Past Bookings Fetched Successfullu!",
//       bookings,
//     });
//   } catch (error) {
//     console.error("Error fetching Past Bookings", error);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const upcomingBookings = async (req, res) => {
//   const uid = req.user.id;
//   if (!uid) {
//     return res.status(401).json({ message: "User not found!" });
//   }
//   try {
//     const bookings = await TblBook.findAll({
//       where: {
//         add_user_id: uid,
//         book_status: "Confirmed",
//       },
//       include: {
//         model: Property,
//         as: "properties",
//         add_user_id: uid,
//         attributes: [
//           "id",
//           "title",
//           "price",
//           "facility",
//           "rules",
//           "price",
//           "image",
//         ],
//       },
//     });
//     if (bookings.length === 0) {
//       return res.status(404).json({ message: "No Upcoming Bookings Found!" });
//     }
//     res
//       .status(201)
//       .json({ message: "Upcoming Bookings Fetched Successfully!", bookings });
//   } catch (error) {}
// };

// Host Properties Bookings Status
const hostPropertiesBookingStatus = async (req, res) => {
  const uid = req.user?.id; // Fetch current user ID

  if (!uid) {
    return res.status(404).json({ message: "User not found!" });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Booking status is required!" });
  }

  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    let whereCondition = { add_user_id: uid }; // Base condition to match current user
    const includeCondition = [
      {
        model: Property,
        as: "properties",
        attributes: [
          "id",
          "title",
          "address",
          "price",
          "facility",
          "rules",
          "image",
        ],
      },
      {
        model: PersonRecord,
        as: "travelerDetails", // Match this alias with the association
        attributes: ["fname", "mobile", "email"],
        // required: false,
      },
    ];

    // Define conditions based on booking status
    switch (status) {
      case "current":
        whereCondition = {
          ...whereCondition,
          book_status: "Check_in",
          book_date: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      case "active":
        whereCondition = {
          ...whereCondition,
          book_status: "Confirmed",
          book_date: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      case "cancelled":
        whereCondition = {
          ...whereCondition,
          book_status: "Cancelled",
        };
        break;

      case "pending":
        whereCondition = {
          ...whereCondition,
          book_status: "Booked",
        };
        break;

      case "past":
        whereCondition = {
          ...whereCondition,
          book_status: { [Op.in]: ["Completed", "Cancelled"] },
        };
        break;

      case "check_in":
        whereCondition = {
          ...whereCondition,
          book_status: "Confirmed",
          check_in: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      case "check_out":
        whereCondition = {
          ...whereCondition,
          book_status: "Check_in",
          check_out: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      default:
        return res.status(400).json({ message: "Invalid booking status!" });
    }

    // Fetch bookings from the database
    const bookings = await TblBook.findAll({
      where: whereCondition,
      include: includeCondition,
      order: [["id", "DESC"]],
    });

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: `No bookings found for status: ${status}` });
    }

    // Process booking data to calculate additional fields like no_of_days
    const processedBookings = bookings.map((booking) => {
      const no_of_days = Math.ceil(
        (new Date(booking.check_out) - new Date(booking.check_in)) /
          (1000 * 60 * 60 * 24)
      );

      // Determine traveler details (either self or from PersonRecord)
      const travelerDetails =
        booking.book_for === "self"
          ? {
              name: req.user.name, // Get current user's details directly
              contact: req.user.mobile,
              email: req.user.email,
            }
          : booking.travelerDetails;

      return {
        ...booking.toJSON(),
        no_of_days,
        travelerDetails,
      };
    });

    res.status(200).json({
      message: `${
        status.charAt(0).toUpperCase() + status.slice(1)
      } bookings fetched successfully!`,
      bookings: processedBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const propertyBookingStatus = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User not found!" });
  }

  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "Booking Status is Required!" });
  }

  try {
    let queryFilter = { uid };
    let includeReviewList = false;

    // Adjust query filters based on status
    if (status === "active") {
      queryFilter.book_status = { [Op.in]: ["Booked"] };
    } else if (status === "Completed") {
      queryFilter.book_status = { [Op.in]: ["Completed"] };
      includeReviewList = true;
    } else if (status === "Cancelled") {
      queryFilter.book_status = { [Op.in]: ["Cancelled"] };
    } else {
      return res.status(400).json({ message: "Invalid status provided!" });
    }

    // Fetch bookings based on query filters
    const bookings = await TblBook.findAll({
      where: queryFilter,
      order: [["id", "DESC"]],
    });

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found for the specified status!" });
    }

    const bookingDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Fetch the property details
        const property = await Property.findByPk(booking.prop_id, {
          attributes: ["id", "title", "image", "price"],
        });

        if (!property) {
          console.warn(`Property with ID ${booking.prop_id} not found.`);
          return null;
        }

        // Fetch reviews (if needed)
        let reviewList = [];
        let totalReviewCount = 0;

        if (includeReviewList) {
          const reviews = await TblBook.findAll({
            where: {
              prop_id: property.id,
              book_status: { [Op.in]: ["Completed", "Confirmed"] },
              is_rate: 1,
            },
            limit: 3,
          });

          reviewList = await Promise.all(
            reviews.map(async (review) => {
              const userData = await User.findOne({
                where: { id: review.uid },
                attributes: ["pro_pic", "name"],
              });
              return {
                user_img: userData?.pro_pic || null,
                user_title: userData?.name || null,
                user_rate: review.total_rate,
                user_desc: review.rate_text,
              };
            })
          );

          totalReviewCount = await TblBook.count({
            where: {
              prop_id: property.id,
              book_status: "Completed",
              is_rate: 1,
            },
          });
        }

        // Assemble booking details
        return {
          book_id: booking.id,
          prop_id: property.id,
          prop_img: property.image,
          prop_title: property.title,
          book_status: booking.book_status,
          prop_price: booking.prop_price,
          p_method_id: booking.p_method_id,
          total_day: booking.total_day,
          total_rate: booking.total_rate,
          reviews: includeReviewList ? reviewList : undefined,
          total_review_count: includeReviewList ? totalReviewCount : undefined,
        };
      })
    );

    // Filter out any null entries
    const validBookingDetails = bookingDetails.filter(
      (detail) => detail !== null
    );

    return res.status(200).json({
      message: "Status Wise Property Details Found!",
      data: { statuswise: validBookingDetails },
    });
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

module.exports = {
  createBooking,
  confirmBooking,
  userCheckIn,
  userCheckOut,
  getBookingDetails,
  cancelBooking,
  getBookingsByStatus,
  // currentBookingStatus,
  // pendingBookings,
  // pastBookings,
  // upcomingBookings,
  hostPropertiesBookingStatus,
  propertyBookingStatus,

  getMyUserBookings,
  getMyUserBookingDetails,
  myUserCancelBookings,
};
