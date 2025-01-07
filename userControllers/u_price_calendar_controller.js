const PriceCalendar = require("../models/PriceCalendar");
const Property = require("../models/Property");

/**
 * Add or update a price in the price calendar.
 * @param {*} req - Request object containing user and price calendar data.
 * @param {*} res - Response object.
 */
const addPriceCalendar = async (req, res) => {
  const uid = req.user.id; // Ensure the user is authenticated.
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
    // Verify if the property exists and is associated with the current user.
    const property = await Property.findOne({
      where: {
        id: prop_id,
        add_user_id: uid, // Assumes `add_user_id` references the owner in the Property table.
      },
    });

    if (!property) {
      return res.status(404).json({
        message:
          "Property not found! or You don't have permission to add price to this property.",
      });
    }

    // Check if a price entry exists for the given date and property.
    const existingEntry = await PriceCalendar.findOne({
      where: {
        date: date,
        prop_id: prop_id,
      },
    });

    if (existingEntry) {
      // Update the existing price entry.
      existingEntry.price = price;
      existingEntry.note = note;
      await existingEntry.save();

      return res.status(200).json({
        message: "Property Price Updated Successfully!",
        data: existingEntry,
      });
    } else {
      // Create a new price entry.
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

module.exports = { addPriceCalendar };
