const TblCoupon = require('../models/TblCoupon');
const fs = require('fs');
const path = require('path');

// Create or Update Coupon
const upsertCoupon = async (req, res) => {
  const { id, expire_date, coupon_code, title, subtitle, status, min_amt, coupon_val, description, img } = req.body;
  let imgPath = img || ''; // Default to image URL if provided

  if (req.file) {
    imgPath = `uploads/${req.file.filename}`;
  }

  try {
    if (id) {
      // Update coupon
      const coupon = await TblCoupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      if (req.file && coupon.c_img && !coupon.c_img.startsWith('http')) {
        fs.unlinkSync(path.join(__dirname, '..', coupon.c_img)); // Remove old image if not a URL
      }

      coupon.c_img = imgPath || coupon.c_img;
      coupon.cdate = expire_date;
      coupon.c_title = coupon_code;
      coupon.ctitle = title;
      coupon.subtitle = subtitle;
      coupon.status = status;
      coupon.min_amt = min_amt;
      coupon.c_value = coupon_val;
      coupon.c_desc = description;

      await coupon.save();
      res.status(200).json({ message: 'Coupon updated successfully', coupon });
    } else {
      // Create new coupon
      const coupon = await TblCoupon.create({
        c_img: imgPath,
        cdate: expire_date,
        c_title: coupon_code,
        ctitle: title,
        subtitle: subtitle,
        status,
        min_amt,
        c_value: coupon_val,
        c_desc: description
      });
      res.status(201).json({ message: 'Coupon created successfully', coupon });
    }
  } catch (error) {
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
