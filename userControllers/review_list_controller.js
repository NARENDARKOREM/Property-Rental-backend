const TblBook=require("../models/TblBook")
const {Op} =require("sequelize")

const getReviews = async (req, res) => {
    const { orag_id } = req.body;
  
    if (!orag_id) {
      return res.status(400).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Something Went Wrong!",
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



module.exports={
  getReviews,
  updateRating
}  