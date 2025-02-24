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
          as: "travler_details",
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
      traveler_id: booking.travler_details.id,
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

const getHostTravelerReviews = async (req, res) => {
  try {
    const { traveler_id } = req.query;

    if (!traveler_id) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Traveler ID is required!",
      });
    }

    // Fetch traveler details
    const traveler = await User.findOne({
      where: { id: traveler_id },
      attributes: ["id", "name", "email", "pro_pic", "mobile"],
    });

    if (!traveler) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Traveler not found!",
      });
    }

    // Fetch all reviews related to the traveler
    const reviews = await HostTravelerReview.findAll({
      where: { traveler_id },
      attributes: ["rating", "review", "createdAt", "host_id"],
    });

    if (reviews.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No reviews found for the specified traveler.",
      });
    }

    // Aggregate rating data
    const ratingsCount = [0, 0, 0, 0, 0]; // To store counts for 1, 2, 3, 4, 5 stars
    let totalRating = 0;

    reviews.forEach((review) => {
      const rate = Math.round(review.rating);
      if (rate >= 1 && rate <= 5) {
        ratingsCount[rate - 1] += 1;
        totalRating += review.rating;
      }
    });

    const totalRatings = reviews.length;
    const totalReviews = reviews.filter((review) => review.review).length;
    const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;

    // Fetch host details for each review
    const detailedReviews = await Promise.all(
      reviews.map(async (review) => {
        const host = await User.findOne({
          where: { id: review.host_id },
          attributes: ["name", "pro_pic"],
        });

        return {
          host_name: host ? host.name : "Unknown Host",
          host_pro_pic: host ? host.pro_pic : null,
          posted_date: review.createdAt,
          rate: review.rating,
          review: review.review,
        };
      })
    );

    // Prepare response data
    res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Traveler reviews fetched successfully!",
      data: {
        traveler: {
          id: traveler.id,
          name: traveler.name,
          email: traveler.email,
          pro_pic: traveler.pro_pic,
          phone: traveler.mobile,
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
    console.error("Error fetching host traveler reviews:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};



module.exports = { hostTravelerReview, getHostTravelerReviews };
