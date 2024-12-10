const { Op } = require('sequelize');
const TblBook = require('../models/TblBook');
const TblNotification = require('../models/TblNotification');
const Property = require('../models/Property');

// Create a Booking
const createBooking = async (req, res) => {
  const { prop_id, check_in, check_out, subtotal, total, tax, cou_amt, wall_amt, transaction_id, p_method_id, add_note, book_for, noguest } = req.body;
  const uid = req.user.id; // Get the user ID from the authenticated user
  const book_date = new Date(); // Current date as booking date

  try {
    // Check if the property exists
    const property = await Property.findByPk(prop_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const total_day = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24)); // Calculate total days
    const prop_price = total / total_day; // Calculate property price

    const newBooking = await TblBook.create({
      prop_id,
      uid, // Ensure this is the authenticated user's ID
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
      book_status: 'Booked',
      total_day,
      prop_price,
      prop_img: property.image || '', // Use property image if not provided in the request
      prop_title: property.title || '', // Use property title if not provided in the request
      add_user_id: uid // Ensure this is the authenticated user's ID
    });

    // Send notification
    await TblNotification.create({
      uid, // Ensure this is the authenticated user's ID
      datetime: new Date(),
      title: 'Booking Confirmed',
      description: `Your booking for property ID ${prop_id} has been confirmed. Check-in: ${check_in}, Check-out: ${check_out}.`
    });

    res.status(201).json({ message: 'Booking created successfully', newBooking });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get Booking Details by User
const getBookingDetailsByUser = async (req, res) => {
    const uid = req.user.id;

    try {
        const bookings = await TblBook.findAll({ where: { uid } });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// getting all bookings
const gettingAllBookings = async (req, res) => {
    try {
        const bookings = await TblBook.findAll();
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Cancel a Booking
const cancelBooking = async (req, res) => {
    const { id } = req.params;
    const { cancle_reason } = req.body;
    const uid = req.user.id;

    try {
        const booking = await TblBook.findOne({ where: { id, uid } });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.book_status === 'Cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        booking.book_status = 'Cancelled';
        booking.cancle_reason = cancle_reason;
        await booking.save();
        res.status(200).json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Status Wise Bookings
const getStatusWiseBookings = async (req, res) => {
    const { status } = req.params;

    try {
        const bookings = await TblBook.findAll({ where: { book_status: status } });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// for changing status
const changeStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Ensure the status value is valid before proceeding
        if (!status || !['Completed', 'Confirmed', 'Cancelled','Check_in','Booked',].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Update the booking status
        const [updatedRows] = await TblBook.update(
            { book_status: status },
            { where: { id } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ error: 'Booking not found or no changes made.' });
        }

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};



// Search Bookings by Date Range
const searchBookingsByDate = async (req, res) => {
    const { start_date, end_date } = req.body;

    try {
        const bookings = await TblBook.findAll({
            where: {
                book_date: {
                    [Op.between]: [new Date(start_date), new Date(end_date)]
                }
            }
        });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    createBooking,
    getBookingDetailsByUser,
    cancelBooking,
    getStatusWiseBookings,
    searchBookingsByDate,
    changeStatus,
    gettingAllBookings
};
