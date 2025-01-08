const PriceCalendar = require("../models/PriceCalendar");
const Property = require("../models/Property");

const addPriceCalendar = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User not found" });
  }

  const { date, price, note, prop_id } = req.body;
  if (!date || !price || !note || !prop_id) {
    return res.status(400).json({
      message: "All Fields Required!",
    });
  }

  try {
    const property = await Property.findOne({
      where: {
        id: prop_id,
        add_user_id: uid,
      },
    });

    if (!property) {
      return res.status(404).json({
        message:
          "Property not found! or You don't have permission to add price to this property.",
      });
    }

    const existingEntry = await PriceCalendar.findOne({
      where: {
        date: date,
        prop_id: prop_id,
      },
    });

    if (existingEntry) {
      existingEntry.price = price;
      existingEntry.note = note;
      await existingEntry.save();

      return res.status(200).json({
        message: "Property Price Updated Successfully!",
        data: existingEntry,
      });
    } else {
      const newEntry = await PriceCalendar.create({
        date: date,
        price: price,
        note: note,
        prop_id: prop_id,
      });

      return res.status(201).json({
        message: "Property Price Added Successfully!",
        data: newEntry,
      });
    }
  } catch (error) {
    console.error("Error adding or updating price:", error);
    return res.status(500).json({
      message: "An error occurred while adding the price.",
    });
  }
};

const fetchAllDetails = async (req, res) => {
    try {
      const allDetails = await PriceCalendar.findAll();
  
      if (!allDetails || allDetails.length === 0) {
        return res.status(404).json({ message: "No Price Calendar entries found!" });
      }
  
      return res.status(200).json({
        message: "Price Calendar details fetched successfully!",
        data: allDetails,
      });
    } catch (error) {
      console.error("Error fetching price calendar details:", error);
      return res.status(500).json({
        message: "An error occurred while fetching the price calendar details.",
      });
    }
  };

module.exports = { addPriceCalendar,fetchAllDetails };
