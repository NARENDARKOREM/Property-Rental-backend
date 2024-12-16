const Property = require("../models/Property");
const fs = require("fs");
const path = require("path");
const TblCategory = require("../models/TblCategory");
const TblCountry = require("../models/TblCountry");

// Create or Update Property
const upsertProperty = async (req, res) => {

    const { id, title, image, price, status, address, facility, description, beds, bathroom, sqrft, rate, ptype, latitude, longtitude, mobile, city, listing_date, add_user_id, rules, country_id, plimit, is_sell } = req.body;


  console.log(req.body, " from property");


    try {
        if (id) {
            
            const property = await Property.findByPk(id);
            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }
            Object.assign(property, {
                title, image, price, status, address, facility, description, beds, bathroom, sqrft, rate, ptype, latitude, longtitude, mobile, city, listing_date, add_user_id, rules, country_id, plimit, is_sell
            });

            await property.save();
            res.status(200).json({ message: 'Property updated successfully', property });
        } else {
            // Create new property
            const property = await Property.create({
                title, image, price, status, address, facility, description, beds, bathroom, sqrft, rate, ptype, latitude, longtitude, mobile, city, listing_date, add_user_id, rules, country_id, plimit, is_sell
            });
            res.status(201).json({ message: 'Property created successfully', property });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });

    }
};

// Get All Properties
const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      include: [{
        model: TblCategory,
        as: "category", 
        attributes: ["title"],  
      },{
        model: TblCountry,
        as: "country", 
        attributes: ["title"], 
      }]
    });
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

// Get Property Count
const getPropertyCount = async (req, res) =>{
  try {
    const propertyCount = await Property.count();
    res.status(200).json({count:propertyCount});
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
}

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

  try {
    const property = await Property.findOne({ where: { id }, paranoid: false });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (property.deletedAt && forceDelete !== "true") {
      return res
        .status(400)
        .json({ error: "Property is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (property.image && !property.image.startsWith("http")) {
        const imagePath = path.join(__dirname, "..", property.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Remove image file if it exists and it's a local path
        } else {
          console.warn(`File not found: ${imagePath}`); // Log a warning if file not found
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

module.exports = {
  upsertProperty,
  getAllProperties,
  getPropertyById,
  deleteProperty,
  getPropertyCount
};
