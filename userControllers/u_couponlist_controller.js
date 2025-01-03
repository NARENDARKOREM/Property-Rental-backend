const TblCoupon = require("../models/TblCoupon");
const { Op } = require("sequelize");

const getCoupons = async (req, res) => {
  // const { uid } = req.body;

  // // Validate the input
  // if (!uid) {
  //   return res.status(400).json({
  //     ResponseCode: "401",
  //     Result: "false",
  //     ResponseMsg: "Something Went Wrong!",
  //   });
  // }

  try {
    const currentDate = new Date().toISOString().split("T")[0];

    // Find all active coupons
    const coupons = await TblCoupon.findAll({
      where: {
        status: 1,
      },
    });

    const couponList = [];

    for (let coupon of coupons) {
      if (coupon.cdate < currentDate) {
        // Update expired coupons
        await TblCoupon.update(
          { status: 0 },
          {
            where: {
              id: coupon.id,
            },
          }
        );
      } else {
        // Add active coupons to the list
        couponList.push({
          id: coupon.id,
          c_img: coupon.c_img,
          cdate: coupon.cdate,
          c_desc: coupon.c_desc,
          c_value: coupon.c_value,
          coupon_code: coupon.c_title,
          coupon_title: coupon.ctitle,
          min_amt: coupon.min_amt,
        });
      }
    }

    if (couponList.length === 0) {
      return res.status(200).json({
        couponlist: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "Coupons Not Found!",
      });
    }

    res.status(200).json({
      couponlist: couponList,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Coupon List Found!",
    });
  } catch (error) {
    console.error("Error fetching coupons:", error.message);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const applyCoupon = async (req, res) => {

  const uid = req.user.id;
  if (!uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User Not Found!",
    });
  }

  const { cid } = req.body;

  if (!cid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    const coupon = await TblCoupon.findOne({
      where: { id: cid },
    });

    if (!coupon) {
      return res.status(404).json({

        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Coupon Not Exist!!",
      });
    }

    if (coupon) {
      return res.status(200).json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Coupon Applied Successfully!!",
      });
    } else {
      return res.status(404).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Coupon Not Exist!!",
      });
    }
  } catch (error) {
    console.error("Error applying coupon:", error.message);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

module.exports = { getCoupons, applyCoupon };
