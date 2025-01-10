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

const createReview = async (req, res) => {
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

module.exports = {
  getReviews,
  updateRating,
  createReview,
  fetchReviews,
};