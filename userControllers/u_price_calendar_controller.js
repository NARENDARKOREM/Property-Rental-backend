const PriceCalendar = require("../models/PriceCalendar");
const Property = require("../models/Property");

const addPriceCalendar = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User not found" });
  }

  const { prop_id, entries } = req.body;
  if (!prop_id || !entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({
      message: "Property ID and entries are required!",
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
        message: "Property not found or you don't have permission to add price to this property.",
      });
    }

    for (const entry of entries) {
      const { date, price, note } = entry;

      if (!Array.isArray(date) || !price || !note) {
        return res.status(400).json({
          message: "Invalid entry format. Each entry must include date(s), price, and note.",
        });
      }

      for (const singleDate of date) {
        const existingEntry = await PriceCalendar.findOne({
          where: {
            date: singleDate,
            prop_id: prop_id,
          },
        });

        if (existingEntry) {
          existingEntry.price = price;
          existingEntry.note = note;
          await existingEntry.save();
        } else {
          await PriceCalendar.create({
            date: singleDate,
            price: price,
            note: note,
            prop_id: prop_id,
          });
        }
      }
    }

    return res.status(200).json({
      message: "Property prices added/updated successfully!",
    });
  } catch (error) {
    console.error("Error adding or updating prices:", error);
    return res.status(500).json({
      message: "An error occurred while adding or updating prices.",
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
