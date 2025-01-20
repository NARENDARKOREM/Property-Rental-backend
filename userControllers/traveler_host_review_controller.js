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

const getTravelerHostReviews = async (req, res) => {
  try {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Property ID is required!",
      });
    }

    // Fetch property details along with host details
    const property = await Property.findOne({
      where: { id: propertyId },
      attributes: ["id", "title", "city", "add_user_id"], // Property details
      include: [
        {
          model: User,
          as: "Owner",
          attributes: ["id", "name", "email", "pro_pic", "mobile"], // Host details
        },
      ],
    });

    if (!property) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Property not found!",
      });
    }

    // Fetch all reviews for the property
    const reviews = await TravelerHostReview.findAll({
      where: { property_id: propertyId },
      attributes: ["rating", "review", "createdAt", "traveler_id"],
    });

    if (reviews.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No reviews found for the specified property.",
      });
    }

    // Initialize aggregate data
    const ratingsCount = [0, 0, 0, 0, 0]; // To store counts for 1, 2, 3, 4, 5 stars
    let totalRating = 0;

    reviews.forEach((review) => {
      const rate = Math.round(review.rating);
      if (rate >= 1 && rate <= 5) {
        ratingsCount[rate - 1] += 1; // Increment the respective star count
        totalRating += review.rating; // Add to the total rating
      }
    });

    const totalRatings = reviews.length;
    const totalReviews = reviews.filter((review) => review.review).length; // Count reviews with text
    const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;

    // Fetch detailed review data with traveler details
    const detailedReviews = await Promise.all(
      reviews.map(async (review) => {
        const traveler = await User.findOne({
          where: { id: review.traveler_id },
          attributes: ["name", "pro_pic"],
        });

        return {
          name: traveler ? traveler.name : "Unknown Traveler",
          pro_pic: traveler ? traveler.pro_pic : null,
          posted_date: review.created_at,
          rate: review.rating,
          review: review.review,
        };
      })
    );

    // Prepare the response
    res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Traveler host reviews fetched successfully!",
      data: {
        host: {
          id: property.Owner.id,
          name: property.Owner.name,
          email: property.Owner.email,
          pro_pic: property.Owner.pro_pic,
          phone: property.Owner.mobile,
        },
        property: {
          id: property.id,
          title: property.title,
          location: property.location,
        },
        aggregate: {
          average_rating: averageRating.toFixed(2),
          ratings_count: {
            5: ratingsCount[4],
            4: ratingsCount[3],
            3: ratingsCount[2],
            2: ratingsCount[1],
            1: ratingsCount[0],
          },
          total_ratings: totalRatings,
          total_reviews: totalReviews,
        },
        reviews: detailedReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching traveler host reviews:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

module.exports = { travelerHostReview, getTravelerHostReviews };
