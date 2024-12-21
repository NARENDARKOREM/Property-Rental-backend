// controllers/propertyController.js
const Property = require('../models/Property');
const cloudinary = require('cloudinary').v2;

const addProperty = async (req, res) => {
  try {
    const {
      status, title, address, description, ccount, facility, ptype, beds, bathroom, sqft, rate, latitude, longtitude, mobile, price, plimit, country_id, pbuysell, img
    } = req.body;

    const user_id = req.user.id; // Get the logged-in user's ID
    const listing_date = new Date();

    // Validate input
    if (!user_id || !pbuysell || !country_id || !plimit || !status || !title || !address || !description || !ccount || !facility || !ptype || !beds || !bathroom || !sqft || !rate || !latitude || !mobile || !listing_date || !price) {
      return res.status(400).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Something Went Wrong!",
      });
    }

    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(img, {
      folder: 'property_images'
    });

    // Save the property details and image URL
    const imageUrl = result.secure_url; // Cloudinary image URL

    // Create the property
    const property = await Property.create({
      image: imageUrl,
      status,
      title,
      price,
      address,
      facility,
      description,
      beds,
      bathroom,
      sqrft: sqft,
      rate,
      ptype,
      latitude,
      longtitude,
      mobile,
      city: ccount,
      listing_date,
      add_user_id: user_id,
      pbuysell,
      country_id,
      plimit,
    });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Added Successfully",
      property,
    });
  } catch (error) {
    console.error("Error adding property:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal server error.",
    });
  }
};

module.exports = {
  addProperty,
};
