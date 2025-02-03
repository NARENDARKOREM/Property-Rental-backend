const Property = require("../models/Property");
const fs = require("fs");
const path = require("path");
const { TblCategory, TblCountry, } = require("../models");
const TblFacility = require("../models/TblFacility");
const TblCity = require('../models/TblCity');
const { error } = require("console");
const { formatDate } = require("../../helper/formatedDate");
const uploadToS3 = require("../config/fileUpload.aws");

// Create or Update Property
const upsertProperty = async (req, res) => {
  const {
    id,
    title,
    is_panorama,
    price,
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
    extra_guest_charges
  } = req.body;

  console.log(req.body, "from bodyyyyyyyyy");

  let imgUrl;

  if (req.file) {
    // If there's a file, upload it to S3
    imgUrl = await uploadToS3(req.file, "Property");
    console.log(imgUrl)
  }

  try {
    const validateCity = await TblCity.findOne({where:{title:city}})
    if(validateCity){
      res.status(400).json({error:"Selected CIty is Found!"})
    }

    if (id) {
      // Update an existing property
      const property = await Property.findByPk(id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Update the property fields
      property.title = title;
      property.image = imgUrl || property.image; // Update image only if a new one is provided
      property.price = price;
      property.is_panorama = is_panorama;
      property.status = status;
      property.address = address;
      property.facility = facility;
      property.description = description;
      property.beds = beds;
      property.bathroom = bathroom;
      property.sqrft = sqrft;
      property.rate = rate;
      property.ptype = ptype;
      property.latitude = latitude;
      property.longtitude = longtitude;
      property.mobile = mobile;
      property.city = city;
      property.listing_date = listing_date;
      property.rules = rules;
      property.country_id = country_id;
      property.plimit = plimit;
      property.is_sell = is_sell;
      property.adults = adults;
      property.children = children;
      property.infants = infants;
      property.pets = pets;
      property.setting_id = setting_id;
      property.extra_guest_charges = extra_guest_charges;

      // Save the updated property
      await property.save();

      return res.status(200).json({ message: "Property updated successfully", property });
    } else {
      // Create a new property
      const property = await Property.create({
        title,
        image: imgUrl, // Upload image to S3 and get the URL
        is_panorama,
        price,
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
        is_sell,
        adults,
        children,
        infants,
        pets,
        setting_id,
        extra_guest_charges
      });

      return res.status(201).json({ message: "Property created successfully", property });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
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
              attributes: ["title"], 
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

        // Format the listing date
        const formattedListingDate = property.listing_date
          ? formatDate(property.listing_date) 
          : null;

        return {
          ...property.toJSON(),
          facilities,
          city: cityWithCountry, 
          listing_date: formattedListingDate, 
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
