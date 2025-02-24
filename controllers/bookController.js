const { Op, where } = require("sequelize");
const TblBook = require("../models/TblBook");
const TblNotification = require("../models/TblNotification");
const Property = require("../models/Property");
const User = require("../models/User"); // Import the User model
const sendPushNotification = require("../config/pushNotification");
const { default: ical } = require("ical-generator");
const { default: axios } = require("axios");
const icals = require('node-ical');

// Create a Booking
const createBooking = async (req, res) => {
  const {
    prop_id,
    check_in,
    check_out,
    subtotal,
    total,
    tax,
    cou_amt,
    wall_amt,
    transaction_id,
    p_method_id,
    add_note,
    book_for,
    noguest,
  } = req.body;
  const uid = req.user.id; 
  console.log("Authenticated user ID in createBooking: ", uid); 
  const book_date = new Date(); 

  if (!prop_id || !uid || !check_in || !check_out || !subtotal || !total || !tax || !p_method_id ) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Check if the property exists
    const property = await Property.findByPk(prop_id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Fetch the user details
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const total_day = Math.ceil(
      (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)
    ); 
    const prop_price = total / total_day; 

    const conflictingBookings = await TblBook.findAll({
      where: {
        prop_id,
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
        book_status: {
          [Op.not]: "Cancelled",
        },
      },
    });

    if (conflictingBookings.length > 0) {
      return res.status(200).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "That Date Range Already Booked!",
      });
    }

    const newBooking = await TblBook.create({
      prop_id,
      uid, 
      book_date,
      check_in,
      check_out,
      subtotal,
      total,
      tax,
      cou_amt,
      wall_amt,
      transaction_id,
      p_method_id,
      add_note,
      book_for,
      noguest,
      book_status: "Booked",
      total_day,
      prop_price,
      prop_img: property.image || "", 
      prop_title: property.title || "", 
      add_user_id:property.add_user_id , 
    });

    await sendPushNotification(uid,newBooking);

    // const notificationContent = {
    //   app_id: process.env.ONESIGNAL_APP_ID,
    //   included_segments: ["Active Users"],
    //   data: { order_id: newBooking.id, type: "normal" },
    //   filters: [{ field: "tag", key: "user_id", relation: "=", value: uid }],
    //   contents: { en: `${user.name}, Your Booking #${newBooking.id} Has Been Received.` },
    //   headings: { en: "Booking Received!!" },
    // };

    // await axios.post("https://onesignal.com/api/v1/notifications", notificationContent, {
    //   headers: {
    //     "Content-Type": "application/json; charset=utf-8",
    //     Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    //   },
    // });

    // Send notification
    await TblNotification.create({
      uid, 
      datetime: new Date(),
      title: "Booking Confirmed",
      description: `Your booking for property ID ${prop_id} has been confirmed. Check-in: ${new Date(
        check_in
      ).toDateString()}, Check-out: ${new Date(check_out).toDateString()}.`,
    });

    res.status(201).json({
      message: "Booking created successfully",
      user_name: user.name, // Add the user's name to the response
      booking: {
        id: newBooking.id,
        prop_id: newBooking.prop_id,
        uid: newBooking.uid,
        book_date: newBooking.book_date,
        check_in: newBooking.check_in,
        check_out: newBooking.check_out,
        subtotal: newBooking.subtotal,
        total: newBooking.total,
        tax: newBooking.tax,
        cou_amt: newBooking.cou_amt,
        wall_amt: newBooking.wall_amt,
        transaction_id: newBooking.transaction_id,
        p_method_id: newBooking.p_method_id,
        add_note: newBooking.add_note,
        book_for: newBooking.book_for,
        is_rate: newBooking.is_rate,
        total_rate: newBooking.total_rate,
        rate_text: newBooking.rate_text,
        prop_price: newBooking.prop_price,
        cancle_reason: newBooking.cancle_reason,
        total_day: newBooking.total_day,
        prop_img: newBooking.prop_img,
        prop_title: newBooking.prop_title,
        add_user_id: newBooking.add_user_id,
        check_intime: newBooking.check_intime,
        check_outtime: newBooking.check_outtime,
        noguest: newBooking.noguest,
        createdAt: newBooking.createdAt,
        updatedAt: newBooking.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in createBooking: ", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Booking Details by User
const getBookingDetailsByUser = async (req, res) => {
  const uid = req.user.id;

  try {
    const bookings = await TblBook.findAll({ where: { uid } });
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// getting all bookings
const gettingAllBookings = async (req, res) => {
  try {
    const bookings = await TblBook.findAll();
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// getting booking counts by status
const getBookingCountByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    const validStatuses = [
      "Booked",
      "Check_in",
      "Completed",
      "Cancelled",
      "Confirmed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const bookingStatusCount = await TblBook.count({
      where: { book_status: status },
    });

    res.status(200).json({ count: bookingStatusCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Cancel a Booking
const cancelBooking = async (req, res) => {
  const { cancle_reason } = req.body;
  const uid = req.user.id;
  if (!uid) {
    return res.status(404).json({ message: "User not found!" });
  }

  try {
    const booking = await TblBook.findOne({ where: { uid } });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.book_status === "Cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    booking.book_status = "Cancelled";
    booking.cancle_reason = cancle_reason;
    await booking.save();
    res
      .status(200)
      .json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Status Wise Bookings
const getStatusWiseBookings = async (req, res) => {
  const { status } = req.params;

  try {
    const bookings = await TblBook.findAll({ where: { book_status: status } });
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// for changing status
const changeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Ensure the status value is valid before proceeding
    if (
      !status ||
      !["Completed", "Confirmed", "Cancelled", "Check_in", "Booked"].includes(
        status
      )
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Update the booking status
    const [updatedRows] = await TblBook.update(
      { book_status: status },
      { where: { id } }
    );

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ error: "Booking not found or no changes made." });
    }

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Search Bookings by Date Range
const searchBookingsByDate = async (req, res) => {
  const { start_date, end_date } = req.body;

  try {
    const bookings = await TblBook.findAll({
      where: {
        book_date: {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        },
      },
    });
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Notifications for User
const getUserNotifications = async (req, res) => {
  const uid = req.user.id;

  try {
    const notifications = await TblNotification.findAll({ where: { uid } });
    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const seAllDetails = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    // Validate input
    if (!id || !status) {
      return res.status(400).json({ 
        error: 'Validation Error', 
        message: 'Both ID and status are required to fetch booking details.' 
      });
    }

    // Fetch booking details
    const booking = await TblBook.findOne({
      where: { id, book_status: status }, 
      include: [
        {
          model: User,
          as: 'travler_details', 
          attributes: ['id', 'name', 'email', 'mobile'], 
        },
        {
          model: Property,
          as: 'properties',
          attributes: ['id', 'title', 'address', 'price', 'image'],
        },
      ],
    });

    // Handle case when no booking is found
    if (!booking) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: `No booking found with ID '${id}' and status '${status}'.` 
      });
    }

    // Return booking details
    return res.status(200).json({
      message: 'Booking details fetched successfully.',
      data: booking, 
    });

  } catch (error) {
    // Handle specific error types (example: Sequelize or database errors)
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({ 
        error: 'Database Error', 
        message: 'Invalid query or database operation. Please check your request.' 
      });
    }

    // Catch-all for unexpected errors
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Something went wrong while fetching booking details. Please try again later.', 
      details: error.message 
    });
  }
};


 const exportIcal = async (req, res) => {
  try {
      const { propertyId } = req.params;

      
      if (!propertyId) {
          return res.status(400).json({ message: 'Property ID is required.' });
      }

      
      const bookings = await TblBook.findAll({
          where: { prop_id: propertyId },
          attributes:['check_in','check_out'],
          include: [
              { model: User, as: 'hostDetails', attributes: ['name'] } 
          ]
      });

     
      if (!bookings.length) {
          return res.status(404).json({ message: 'No bookings found for this property.' });
      }

      
      const cal = ical({ name: `Bookings for Property ${propertyId}` });

      bookings.forEach(booking => {
          cal.createEvent({
              start: booking.check_in,
              end: booking.check_out,
              summary: 'Reserved',
              description: `Guest: ${booking.User?.name || 'Unknown'}`, 
          });
      });

     
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="servostay_${propertyId}.ics"`);

      res.send(cal.toString());
  } catch (error) {
      console.error('Error generating iCalendar:', error);

      
      if (error.name === 'SequelizeDatabaseError') {
          return res.status(500).json({ message: 'Database Error. Please check your query.' });
      }

      res.status(500).json({ message: 'Internal Server Error' });
  }
};



const importIcal = async (req, res) => {
  try {
    const { calendarUrl, propertyId, calendarName } = req.body;

    console.log(req.body,"request from import ical");

    
    if (!calendarUrl || !propertyId || !calendarName) {
      return res.status(400).json({ message: 'Calendar URL, Calendar Name, and Property ID are required.' });
    }

    const response = await axios.get(calendarUrl);
    console.log(response,"from icallllllllllllllll")
    const events = icals.parseICS(response.data);
    console.log(events,"from servostayyyyyyyyyyyy");

    
    const bookings = Object.values(events)
      .filter(event => event.start && event.end)
      .map(event => ({
        prop_id: propertyId,
        check_in: new Date(event.start),
        check_out: new Date(event.end),
        add_user_id: req.user?.id || null,
        is_import:true
      }));

    if (!bookings.length) {
      return res.status(400).json({ message: 'No valid bookings found in the iCal file.' });
    }

    await TblBook.bulkCreate(bookings);

    await Property.update(
      { calendarUrl, calendarName },
      { where: { id: propertyId } } 
    );

    res.status(200).json({ message: 'Bookings imported and property updated successfully!', bookings });
  } catch (error) {
    console.error('Error importing iCal:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


module.exports = {
  createBooking,
  getBookingDetailsByUser,
  cancelBooking,
  getStatusWiseBookings,
  searchBookingsByDate,
  changeStatus,
  gettingAllBookings,
  getUserNotifications,
  getBookingCountByStatus,
  seAllDetails,
  exportIcal,
  importIcal
};
