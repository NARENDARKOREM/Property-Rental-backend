const { Op, fn, col } = require("sequelize");
const { Property, TblExtra, User } = require("../models");
const TblBook = require("../models/TblBook");

const dashboardData = async (req, res) => {
  try {
    const uid = req.user.id;
    const propertyId = req.query.propertyId;

    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    const userProperties = await Property.findAll({
      where: { add_user_id: uid },
      attributes: ["id"],
    });

    const userPropertyIds = userProperties.map((property) => property.id);

    if (userPropertyIds.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    const whereCondition = {
      add_user_id: uid,
      book_status: "Completed",
      p_method_id: { [Op.ne]: 2 },
      prop_id: propertyId ? propertyId : { [Op.in]: userPropertyIds },
    };

    const [
      totalPropertyCount,
      totalExtraImageCount,
      totalBookingCount,
      totalReviewCount,
      totalEarnings,
      userData,
      monthlyEarnings,
    ] = await Promise.all([
      Property.count({ where: { add_user_id: uid } }),
      TblExtra.count({ where: { add_user_id: uid } }),
      TblBook.count({
        where: { add_user_id: uid, prop_id: { [Op.in]: userPropertyIds } },
      }),
      TblBook.count({
        where: {
          add_user_id: uid,
          is_rate: 1,
          prop_id: { [Op.in]: userPropertyIds },
        },
      }),
      TblBook.sum("total", { where: whereCondition }),
      User.findOne({ where: { id: uid } }),
      TblBook.findAll({
        attributes: [
          [fn("SUM", col("total")), "totalEarnings"],
          [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
        ],
        where: whereCondition,
        group: ["month"],
        order: [["month", "DESC"]],
      }),
    ]);

    const totalPayout = 0;
    const finalEarnings = (totalEarnings || 0) - totalPayout;

    const reportData = [
      { title: "My Property", report_data: totalPropertyCount || 0 },
      { title: "My Extra Images", report_data: totalExtraImageCount || 0 },
      { title: "My Booking", report_data: totalBookingCount || 0 },
      { title: "My Earning", report_data: finalEarnings },
      { title: "Total Review", report_data: totalReviewCount || 0 },
      { title: "userdetails", report_data: userData || {} },
      { title: "Monthly Earnings", report_data: monthlyEarnings || [] },
    ];

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Report List Get Successfully!!!",
      report_data: reportData,
    });
  } catch (err) {
    console.error("Error fetching report data:", err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

module.exports = {
  dashboardData,
};
