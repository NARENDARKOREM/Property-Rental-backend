const Property = require("../models/Property");
const fs = require("fs");
const path = require("path");
const { TblCategory, TblCountry, } = require("../models");
const TblFacility = require("../models/TblFacility");
const TblCity = require('../models/TblCity');
const { error } = require("console");
const sequelize = require("../db");

// Create or Update Property
const upsertProperty = async (req, res) => {
  try {
    const {
      id,
      title,
      image,
      price,
      is_panorama,
      status,
      address,
      facility,
      description,
      beds,
      bathroom,
      sqrft,
      rate,
      ptype,
      latitude,
      longtitude,
      mobile,
      city,
      listing_date,
      rules,
      country_id,
      plimit,
      is_sell,
      adults,
      children,
      infants,
      pets,
      setting_id,
      extra_guest_charges,
      standard_rules,
    } = req.body;

    console.log(req.body);

    // **Step 1: Validate City**
    if (!city || !city.label) {
      return res.status(400).json({ error: "City is required" });
    }

    const validateCity = await TblCity.findOne({
      where: { title: city.label },
    });

    if (!validateCity) {
      return res.status(400).json({ error: `City '${city.label}' not found in database` });
    }

    // **Step 2: Parse `standard_rules` Safely**
    let parsedStandardRules;
    try {
      parsedStandardRules =
        typeof standard_rules === "object"
          ? standard_rules
          : JSON.parse(standard_rules);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON format in standard_rules" });
    }

    console.log(typeof parsedStandardRules, "Standard Rules");

    // **Step 3: Start Transaction**
    const transaction = await sequelize.transaction();
    try {
      let property;

      if (id) {
        // **Step 4: Fetch Property for Update**
        property = await Property.findByPk(id);
        if (!property) {
          return res.status(404).json({ error: "Property not found" });
        }

        // **Step 5: Update Property**
        await property.update(
          {
            title,
            image,
            price,
            is_panorama,
            status,
            address,
            facility,
            description,
            beds,
            bathroom,
            sqrft,
            rate,
            ptype,
            latitude,
            longtitude,
            mobile,
            city: validateCity.id,
            listing_date,
            rules,
            country_id,
            plimit,
            is_sell,
            adults,
            children,
            infants,
            pets,
            setting_id,
            extra_guest_charges,
            standard_rules: JSON.stringify(parsedStandardRules),
          },
          { transaction }
        );
      } else {
        // **Step 6: Create New Property**
        property = await Property.create(
          {
            title,
            image,
            price,
            is_panorama,
            status,
            address,
            facility,
            description,
            beds,
            bathroom,
            sqrft,
            rate,
            ptype,
            latitude,
            longtitude,
            mobile,
            city: validateCity.id,
            listing_date,
            rules,
            country_id,
            plimit,
            is_sell,
            adults,
            children,
            infants,
            pets,
            setting_id,
            extra_guest_charges,
            standard_rules: JSON.stringify(parsedStandardRules),
          },
          { transaction }
        );
      }

      // **Step 7: Commit Transaction**
      await transaction.commit();
      return res.status(200).json({ message: id ? "Property updated successfully" : "Property added successfully", property });
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ error: "Database operation failed", details: error.message });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


// Get All Properties
const getAllProperties = async (req, res) => { 
  try {
    const properties = await Property.findAll({
      include: [
        {
          model: TblCategory,
          as: "category",
          attributes: ["title"],
        },
        {
          model: TblCity,
          as: "cities",
          attributes: ["title"],
          include: [
            {
              model: TblCountry,
              as: "country",
              attributes: ["title"], // Fetch the country name
            },
          ],
        },
      ],
    });

    const formattedProperties = await Promise.all(
      properties.map(async (property) => {
        const facilityIds = property.facility
          ? property.facility
              .split(",")
              .map((id) => parseInt(id, 10))
              .filter((id) => Number.isInteger(id))
          : [];

        const facilities = facilityIds.length
          ? await TblFacility.findAll({
              where: { id: facilityIds },
              attributes: ["id", "title"],
            })
          : [];

        // Format city name with country name
        const cityWithCountry =
          property.city && property.city.country
            ? `${property.city.title} (${property.city.country.title})`
            : property.city?.title || "";

        // Check if standard_rules exists and is a valid JSON string
        let standardRules = {};

        if (property.standard_rules) {
          try {
            standardRules = JSON.parse(property.standard_rules);
          } catch (error) {
            console.error("Error parsing standard_rules:", error);
            standardRules = {}; // If invalid JSON, default to an empty object
          }
        }

        // Format the standard_rules fields, making sure to handle null/undefined cases
        const formattedStandardRules = {
          checkIn: standardRules.checkIn || "N/A",  // Default to "N/A" if missing
          checkOut: standardRules.checkOut || "N/A", // Default to "N/A" if missing
          smokingAllowed: standardRules.smokingAllowed !== undefined ? standardRules.smokingAllowed : "N/A",  // Default to "N/A" if missing
        };

        return {
          ...property.toJSON(),
          facilities,
          city: cityWithCountry, // Add the formatted city with country name
          formatted_standard_rules: formattedStandardRules, // Add formatted standard rules
        };
      })
    );

    res.status(200).json(formattedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};




// Get Property Count
const getPropertyCount = async (req, res) => {
  try {
    const propertyCount = await Property.count();
    res.status(200).json({ count: propertyCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Single Property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.status(200).json(property);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Property
const deleteProperty = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;
  console.log("Delete request received for Property ID:", id);
console.log("Force Delete:", forceDelete);


  try {
    const property = await Property.findOne({ where: { id }, paranoid: false });
    console.log("Property Found:", property);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.deletedAt && forceDelete !== "true") {
      console.log("Property is already soft-deleted. Cannot delete again.");
      return res
        .status(400)
        .json({ error: "Property is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (property.image && !property.image.startsWith("http")) {
        const imagePath = path.join(__dirname, "..", property.image);
if (fs.existsSync(imagePath)) {
  console.log(`Deleting Image: ${imagePath}`);
  fs.unlinkSync(imagePath);
} else {
  console.warn(`File not found: ${imagePath}`);
}

      }
      await property.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Property permanently deleted successfully" });
    } else {
      await property.destroy();
      res.status(200).json({ message: "Property soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const togglePropertyStatus = async (req, res) => {
  const { id, field, value } = req.body;
  try {
    if (!id || !field || !value === undefined) {
      return res.status(400).json({ message: "Invalid request paylod" });
    }
    console.log("Updating property field:", { id, field, value });
    if (!["status", "is_sell"].includes(field)) {
      console.error(`Invalid field: ${field}`);
      return res.status(400).json({ message: "Invalid field for update " });
    }
    const property = await Property.findByPk(id);
    if (!property) {
      console.error(`Property with ID ${id} not found`);
      return res.status(404).json({ message: "Property not found." });
    }
    property[field] = value;
    await property.save();
    console.log("Payment status updated", property);
    console.log(await Property.findAll());
    res.status(200).json({
      message: `${field} updated successfully.`,
      updatedField: field,
      updatedValue: value,
      property,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const fetchPropertiesByCountries = async (req, res) => {
  try {
    const { country_id } = req.body;
    const properties = await Property.findAll({
      where: { country_id },
      include: [
        {
          model: TblCategory,
          as: "category",
          attributes: ["title"],
        },
        {
          model: TblCountry,
          as: "country",
          attributes: ["title"],
        },
      ],
    });

    const formattedProperties = await Promise.all(
      properties.map(async (property) => {
        const facilityIds = property.facility
          ? property.facility
              .split(",")
              .map((id) => parseInt(id, 10))
              .filter((id) => Number.isInteger(id))
          : [];

        const facilities = facilityIds.length
          ? await TblFacility.findAll({
              where: { id: facilityIds },
              attributes: ["id", "title"],
            })
          : [];

        return {
          ...property.toJSON(),
          facilities,
        };
      })
    );

    res.status(200).json(formattedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const isPanoramaToggle = async (req, res) => {
  const { id, field, value } = req.body;

  if (!id || typeof field !== "string" || value === undefined) {
    return res.status(400).json({ message: "Invalid request payload" });
  }

  try {
    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property[field] = value;
    await property.save();

    return res.status(200).json({ message: "Field updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Database update failed" });
  }
};


module.exports = {
  upsertProperty,
  getAllProperties,
  getPropertyById,
  deleteProperty,
  getPropertyCount,
  togglePropertyStatus,
  fetchPropertiesByCountries,
  isPanoramaToggle,
};
