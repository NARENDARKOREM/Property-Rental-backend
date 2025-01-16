const TravelerHostReview = require("../models/TravelerHostReview");
const User = require("../models/User");
const Property = require("../models/Property");
const TblBook = require("../models/TblBook");

const travelerHostReview = async (req, res) => {
  const uid = req.user.id; // Traveler's user ID
  const { hostId, propertyId, rating, review } = req.body;

  try {
    // Validate the user ID
    if (!uid) {
      return res.status(401).json({ message: "User Not Found!" });
    }

    // Validate request body fields
    if (!hostId || !propertyId || !rating || !review) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Verify the host exists
    const host = await User.findOne({ where: { id: hostId, role: "host" } });
    if (!host) {
      return res.status(404).json({ message: "Host Not Found!" });
    }

    // Verify the property exists and belongs to the host
    const property = await Property.findOne({
      where: { id: propertyId, add_user_id: hostId },
    });
    if (!property) {
      return res.status(400).json({
        message: "Property not found or does not belong to this host!",
      });
    }

    // Verify booking status is "Completed"
    const booking = await TblBook.findOne({
      where: {
        uid: uid,
        prop_id: propertyId,
        book_status: "Completed",
      },
    });

    if (!booking) {
      return res.status(403).json({
        message: "You can only leave a review after completing your stay.",
      });
    }

    // Check if a review already exists for this booking
    const existingReview = await TravelerHostReview.findOne({
      where: { traveler_id: uid, property_id: propertyId },
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already submitted a review for this stay.",
      });
    }

    // Create a new review
    const newReview = await TravelerHostReview.create({
      traveler_id: uid,
      host_id: hostId,
      property_id: propertyId,
      rating,
      review,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const reviewer = await User.findOne({
      where: { id: uid },
      attributes: ["id", "name", "email"],
    });

    return res.status(201).json({
      message: "Review Submitted Successfully.",
      review: {
        ...newReview.dataValues,
        reviewer,
      },
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

module.exports = { travelerHostReview };
