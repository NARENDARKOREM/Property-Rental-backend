const TblCoupon = require('../models/TblCoupon');
const fs = require('fs');
const path = require('path');

// Create or Update Coupon
const upsertCoupon = async (req, res) => {

  const { id, cdate, c_img, c_title, subtitle,ctitle, status, min_amt, c_value, c_desc } = req.body;


  
 

  try {
    if (id) {
      // Update coupon
      const coupon = await TblCoupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      

      coupon.c_img = c_img;
      coupon.cdate = cdate;
      coupon.c_title = c_title;
      coupon.ctitle = ctitle;
      coupon.subtitle = subtitle;
      coupon.status = status;
      coupon.min_amt = min_amt;
      coupon.c_value = c_value;
      coupon.c_desc = c_desc;

      await coupon.save();
      res.status(200).json({ message: 'Coupon updated successfully', coupon });
    } else {
      // Create new coupon
      const coupon = await TblCoupon.create({
        c_img,
        cdate,
        c_title,
        ctitle,
        subtitle,
        status,
        min_amt,
        c_value,
        c_desc,
      });
      res.status(201).json({ message: 'Coupon created successfully', coupon });
    }
  } catch (error) {
    console.error("Error in upsertCoupon: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get All Coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await TblCoupon.findAll();
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get Single Coupon by ID
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await TblCoupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Delete Coupon
const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const coupon = await TblCoupon.findOne({ where: { id }, paranoid: false });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    if (coupon.deletedAt && forceDelete !== 'true') {
      return res.status(400).json({ error: 'Coupon is already soft-deleted' });
    }

    if (forceDelete === 'true') {
      if (coupon.c_img && !coupon.c_img.startsWith('http')) {
        fs.unlinkSync(path.join(__dirname, '..', coupon.c_img)); // Remove image file if it's a local path
      }
      await coupon.destroy({ force: true });
      res.status(200).json({ message: 'Coupon permanently deleted successfully' });
    } else {
      await coupon.destroy();
      res.status(200).json({ message: 'Coupon soft-deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  upsertCoupon,
  getAllCoupons,
  getCouponById,
  deleteCoupon
};
