const { User, Property } = require("../models");
const TblBook = require("../models/TblBook");
const { Op } = require("sequelize");

const getReviews = async (req, res) => {
  const orag_id = req.user.id;
  console.log("UID", req.user.id);

  if (!orag_id) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User not found!",
    });
  }

  try {
    // Fetch reviews from the database
    const reviews = await TblBook.findAll({
      where: {
        add_user_id: orag_id,
        is_rate: 1,
      },
      attributes: ["total_rate", "rate_text"],
    });

    if (reviews.length === 0) {
      return res.status(200).json({
        reviewlist: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "Reviews Not Found!",
      });
    }

    // Map the reviews into the required format
    const reviewList = reviews.map((review) => ({
      total_rate: review.total_rate,
      rate_text: review.rate_text,
    }));

    res.status(200).json({
      reviewlist: reviewList,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Reviews List Found!",
    });
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const updateRating = async (req, res) => {
  const { uid, book_id, total_rate, rate_text } = req.body;

  if (!uid || !book_id || !total_rate || !rate_text) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    const updated = await TblBook.update(
      {
        total_rate,
        rate_text,
        is_rate: 1,
      },
      {
        where: {
          id: book_id,
          uid,
        },
      }
    );

    if (updated[0] === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found or already rated!",
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Rate Updated Successfully!!!",
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const createPropertyReview = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User not found!",
    });
  }

  const { prop_id, total_rate, rate_text } = req.body;

  if (!prop_id || !total_rate || !rate_text) {
    return res.status(400).json({
      ResponseCode: "400",
      Result: "false",
      ResponseMsg: "Invalid Fields! All fields are required.",
    });
  }

  try {
    // Check if the user has a confirmed or completed booking for the property
    const booking = await TblBook.findOne({
      where: {
        prop_id,
        uid:uid,
        book_status: {
          [Op.or]: ["Confirmed", "Completed"], // Only allow reviews for confirmed or completed bookings
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found or not eligible for review!",
      });
    }

    // Update the booking with the rating and review
    const updated = await TblBook.update(
      {
        total_rate,
        rate_text,
        is_rate: 1,
      },
      {
        where: {
          prop_id,
          uid,
        },
      }
    );

    if (updated[0] === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found or already rated!",
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Rate Updated Successfully!",
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const fetchReviews = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Unauthorized! Please login to access reviews.",
      });
    }

    const reviews = await TblBook.findAll({
      where: {
        is_rate: 1,
      },
      attributes: ["uid", "total_rate", "rate_text", "createdAt"],
      include: [
        {
          model: User,
          as: "User",
          attributes: ["name", "email"],
        },
        {
          model: Property, 
          as: "properties",
          attributes: ["id", "add_user_id"],
          include:[
            {
              model:User,
              as:"Owner",
              attributes:["name","email","mobile"]
            }
          ]
        },
      ],
      order: [["createdAt", "DESC"]], 
    });

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No reviews found!",
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Reviews fetched successfully!",
      reviews: reviews.map((review) => ({
        user: review.User.name,
        email: review.User.email,
        rating: review.total_rate,
        review: review.rate_text,
        createdAt: review.createdAt,
        propertyId: review.properties.id,
        ownerDetails:{
          name:review.properties.Owner.name,
          email:review.properties.Owner.email,
          mobile:review.properties.Owner.mobile,
        }
      })),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const getPropertyReviewsAndRatings = async (req, res) => {
  try {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Property ID is required!",
      });
    }

    // Fetch all reviews for the property
    const reviews = await TblBook.findAll({
      where: { prop_id: propertyId, is_rate: 1 }, // Ensure reviews have been rated
      attributes: [
        "total_rate", // Individual rating
        "rate_text", // Review text
        "createdAt", // Posted date
        "uid", // User ID
      ],
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
      const rate = Math.round(review.total_rate); // Round rating to nearest integer
      if (rate >= 1 && rate <= 5) {
        ratingsCount[rate - 1] += 1; // Increment the respective star count
        totalRating += review.total_rate; // Add to the total rating
      }
    });

    const totalRatings = reviews.length;
    const totalReviews = reviews.filter((review) => review.rate_text).length; // Count reviews with text
    const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;

    // Fetch detailed review data
    const detailedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findOne({
          where: { id: review.uid },
          attributes: ["name", "pro_pic"],
        });

        return {
          name: user ? user.name : "Unknown User",
          pro_pic: user ? user.pro_pic : null,
          posted_date: review.createdAt,
          rate: review.total_rate,
          review: review.rate_text,
        };
      })
    );

    // Prepare the response
    res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property reviews and ratings fetched successfully!",
      data: {
        aggregate: {
          average_rating: averageRating.toFixed(2),
          ratings_count: {
            "5": ratingsCount[4],
            "4": ratingsCount[3],
            "3": ratingsCount[2],
            "2": ratingsCount[1],
            "1": ratingsCount[0],
          },
          total_ratings: totalRatings,
          total_reviews: totalReviews,
        },
        reviews: detailedReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching property reviews and ratings:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const createHostReviewAndRating = async (req, res) => {
  try {
    const hostId = req.user.id; // Host user ID
    const { travelerId, bookingId, rating, review } = req.body;

    // Validate host ID
    if (!hostId) {
      return res.status(401).json({ ResponseCode: "401", ResponseMsg: "Host not found!" });
    }

    // Validate traveler and booking IDs
    if (!travelerId || !bookingId) {
      return res.status(400).json({
        ResponseCode: "400",
        ResponseMsg: "Traveler ID and Booking ID are required!",
      });
    }

    // Fetch the booking
    const booking = await TblBook.findOne({
      where: { id: bookingId, uid: travelerId, add_user_id: hostId },
    });

    if (!booking) {
      return res.status(404).json({
        ResponseCode: "404",
        ResponseMsg: "Booking not found or invalid host-traveler relationship!",
      });
    }

    // Check booking status
    if (!["Confirmed", "Completed", "Booked"].includes(booking.book_status)) {
      return res.status(400).json({
        ResponseCode: "400",
        ResponseMsg: "Review can only be added for bookings with status 'Confirmed', 'Completed', or 'Booked'.",
      });
    }

    // Update the booking with host's review and rating
    booking.host_rating = rating;
    booking.host_review = review;
    await booking.save();

    return res.status(200).json({
      ResponseCode: "200",
      ResponseMsg: "Review and rating added successfully!",
      data: {
        travelerId,
        bookingId,
        hostId,
        rating,
        review,
      },
    });
  } catch (error) {
    console.error("Error adding review and rating:", error);
    return res.status(500).json({
      ResponseCode: "500",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const createTravelerReviewAndRating = async (req, res) => {
  try {
    const travelerId = req.user.id; // Traveler user ID
    const { hostId, bookingId, rating, review } = req.body;

    // Validate traveler ID
    if (!travelerId) {
      return res.status(401).json({ ResponseCode: "401", ResponseMsg: "Traveler not found!" });
    }

    // Validate host and booking IDs
    if (!hostId || !bookingId) {
      return res.status(400).json({
        ResponseCode: "400",
        ResponseMsg: "Host ID and Booking ID are required!",
      });
    }

    // Fetch the booking
    const booking = await TblBook.findOne({
      where: { id: bookingId, uid: travelerId, add_user_id: hostId },
    });

    if (!booking) {
      return res.status(404).json({
        ResponseCode: "404",
        ResponseMsg: "Booking not found or invalid traveler-host relationship!",
      });
    }

    // Check booking status
    if (!["Confirmed", "Completed", "Booked"].includes(booking.book_status)) {
      return res.status(400).json({
        ResponseCode: "400",
        ResponseMsg: "Review can only be added for bookings with status 'Confirmed', 'Completed', or 'Booked'.",
      });
    }

    // Update the booking with traveler's review and rating
    booking.traveler_rating = rating;
    booking.traveler_review = review;
    await booking.save();

    return res.status(200).json({
      ResponseCode: "200",
      ResponseMsg: "Review and rating added successfully!",
      data: {
        travelerId,
        bookingId,
        hostId,
        rating,
        review,
      },
    });
  } catch (error) {
    console.error("Error adding review and rating:", error);
    return res.status(500).json({
      ResponseCode: "500",
      ResponseMsg: "Internal Server Error!",
    });
  }
};


module.exports = {
  getReviews,
  updateRating,
  createPropertyReview,
  fetchReviews,
  getPropertyReviewsAndRatings
};