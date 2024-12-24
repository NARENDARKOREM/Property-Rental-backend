
const { Op } = require('sequelize');
const {  Property, TblExtra, User } = require('../models'); 
const TblBook = require('../models/TblBook');

const dashboardData = async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    
    const [
      totalPropertyCount,
      totalExtraImageCount,
      totalBookingCount,
      totalReviewCount,
      totalEarnings,
      userData,
    ] = await Promise.all([
      Property.count({ where: { add_user_id: uid } }),
      TblExtra.count({ where: { add_user_id: uid } }),
     TblBook.count({ where: { add_user_id: uid } }),
      TblBook.count({ where: { add_user_id: uid, is_rate: 1 } }),
      TblBook.sum('total', {
        where: {
          add_user_id: uid,
          book_status: 'Completed',
          p_method_id: { [Op.ne]: 2 }, 
        },
      }),
      User.findOne({ where: { id: uid } }),
    ]);

    
    const totalPayout = 0; 
    const finalEarnings = (totalEarnings || 0) - totalPayout;

    
    const reportData = [
      { title: "My Property", report_data: totalPropertyCount,  },
      { title: "My Extra Images", report_data: totalExtraImageCount, },
      { title: "My Booking", report_data: totalBookingCount,  },
      { title: "My Earning", report_data: finalEarnings,  },
      { title: "Total Review", report_data: totalReviewCount,  },
      { title: "userdetails", report_data: userData,  },
    ];

    // Respond with data
    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Report List Get Successfully!!!",
      report_data: reportData,
    });
  } catch (err) {
    console.error('Error fetching report data:', err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};





module.exports = {
    dashboardData
}


