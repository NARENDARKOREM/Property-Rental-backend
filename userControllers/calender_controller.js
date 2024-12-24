const TblBook=require("../models/TblBook")
const {Op} =require("sequelize")

const getDatesFromRange = (start, end) => {
    const dates = [];
    let current = new Date(start);
  
    while (current <= new Date(end)) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
  
    return dates;
};

const getBookedDates = async (req, res) => {
    const { uid, property_id } = req.body;
  
    if (!uid || !property_id) {
      return res.status(400).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Something Went Wrong!",
      });
    }
  
    try {
      const bookings = await TblBook.findAll({
        where: {
          prop_id: property_id,
          book_status: { [Op.ne]: "Cancelled" }, 
        },
        attributes: ["check_in", "check_out"], 
      });
  
      if (bookings.length === 0) {
        return res.status(200).json({
          datelist: [],
          ResponseCode: "200",
          Result: "false",
          ResponseMsg: "Book Date List Not Found!",
        });
      }
  
      let dateList = [];
      bookings.forEach((booking) => {
        dateList = dateList.concat(getDatesFromRange(booking.check_in, booking.check_out));
      });
  
      const uniqueDates = [...new Set(dateList)].sort();
  
      return res.status(200).json({
        datelist: uniqueDates,
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Book Date List Found!",
      });
    } catch (error) {
      console.error("Error fetching booked dates:", error.message);
      return res.status(500).json({
        ResponseCode: "500",
        Result: "false",
        ResponseMsg: "Internal Server Error",
      });
    }
  };


module.exports={getBookedDates}  