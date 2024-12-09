const { Op } = require('sequelize');
const PersonRecord = require('../models/PersonRecord');
const TblBook = require('../models/TblBook');
const User = require('../models/User');

// Fetch Current User's Person Records
const getPersonRecordsByUser = async (req, res) => {
  const uid = req.user.id; // Get the user ID from the authenticated user
  try {
    // Fetch user details
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch user's bookings
    const bookings = await TblBook.findAll({ where: { uid } });
    const bookingIds = bookings.map(booking => booking.id);

    // Fetch person records related to the user's bookings
    const personRecords = await PersonRecord.findAll({ where: { book_id: { [Op.in]: bookingIds } } });

    // Include email, mobile, and ccode from User table in the person records response
    const personRecordsWithUserDetails = personRecords.map(record => ({
      ...record.toJSON(),
      email: user.email,
      mobile: user.mobile,
      ccode: user.ccode
    }));

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        ccode: user.ccode,
      },
      bookings,
      personRecords: personRecordsWithUserDetails,
    });
  } catch (error) {
    console.error("Error in getPersonRecordsByUser: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Upsert Person Record
const upsertPersonRecord = async (req, res) => {
  const { id, fname, lname, gender, country } = req.body;
  const uid = req.user.id; // Get the user ID from the authenticated user

  try {
    // Fetch user details
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch the most recent booking for the user
    const booking = await TblBook.findOne({ where: { uid }, order: [['createdAt', 'DESC']] });
    if (!booking) {
      return res.status(404).json({ error: 'No bookings found for the user' });
    }

    if (id) {
      // Update person record
      const personRecord = await PersonRecord.findByPk(id);
      if (!personRecord) {
        return res.status(404).json({ error: 'Person record not found' });
      }

      personRecord.book_id = booking.id; // Use the most recent booking id
      personRecord.fname = fname;
      personRecord.lname = lname;
      personRecord.gender = gender;
      personRecord.email = user.email; // Fetch email from User table
      personRecord.mobile = user.mobile; // Fetch mobile from User table
      personRecord.ccode = user.ccode; // Fetch ccode from User table
      personRecord.country = country;

      await personRecord.save();
      res.status(200).json({ message: 'Person record updated successfully', personRecord });
    } else {
      // Create new person record
      const personRecord = await PersonRecord.create({
        book_id: booking.id, // Use the most recent booking id
        fname,
        lname,
        gender,
        email: user.email, // Fetch email from User table
        mobile: user.mobile, // Fetch mobile from User table
        ccode: user.ccode, // Fetch ccode from User table
        country
      });
      res.status(201).json({ message: 'Person record created successfully', personRecord });
    }
  } catch (error) {
    console.error("Error in upsertPersonRecord: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getPersonRecordsByUser,
  upsertPersonRecord
};
