
const TblFaq = require("../models/TblFaq"); 

// Fetch FAQ List
const faqList= async (req, res) => {
 

  try {
    // Fetch FAQs with active status
    const faqs = await TblFaq.findAll({
      where: { status: 1 },
    });

    // Return the FAQ data
    res.status(200).json({
      FaqData: faqs,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Faq List Get Successfully!!",
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error.message);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

module.exports = {faqList}
