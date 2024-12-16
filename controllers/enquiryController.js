const TblEnquiry = require("../models/TblEnquiry");
const Property = require("../models/Property");
const User = require("../models/User");

// Submit Enquiry
const submitEnquiry = async (req, res) => {
  const { prop_id, enquiry_type, message } = req.body;
  const uid = req.user.id; // Get the user ID from the authenticated user

  try {
    const newEnquiry = await TblEnquiry.create({
      prop_id,
      uid,
      add_user_id: uid,
      enquiry_type,
      message,
    });

    res
      .status(201)
      .json({ message: "Enquiry submitted successfully", newEnquiry });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Enquiries for a Specific Property or User
const getEnquiries = async (req, res) => {
  const { prop_id, user_id } = req.query;

  try {
    let enquiries;
    if (prop_id) {
      enquiries = await TblEnquiry.findAll({ where: { prop_id } });
    } else if (user_id) {
      enquiries = await TblEnquiry.findAll({ where: { add_user_id: user_id } });
    } else {
      return res
        .status(400)
        .json({ error: "Property ID or User ID is required" });
    }

    const result = await Promise.all(
      enquiries.map(async (enquiry) => {
        const prop_data = await Property.findByPk(enquiry.prop_id);
        const user_data = await User.findByPk(enquiry.uid);
        return {
          title: prop_data.title,
          image: prop_data.image,
          name: user_data.name,
          mobile: `${user_data.ccode}${user_data.mobile}`,
          is_sell: prop_data.is_sell,
        };
      })
    );

    res.status(200).json({
      message: "Enquiry list retrieved successfully",
      enquiries: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Enquiry Count
const getEnquiryCount = async (req, res) => {
  try {
    const enquiryCount = await TblEnquiry.count();
    res.status(200).json({ count: enquiryCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

module.exports = {
  submitEnquiry,
  getEnquiries,
  getEnquiryCount
};
