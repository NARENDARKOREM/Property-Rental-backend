const Property = require("../models/Property");
const fs = require("fs");
const path = require("path");
const { TblCategory, TblCountry, User, } = require("../models");
const TblFacility = require("../models/TblFacility");
const TblCity = require('../models/TblCity');
const { error } = require("console");
const sequelize = require("../db");
const { Op } = require("sequelize");
const { default: axios } = require("axios");
const TblNotification = require("../models/TblNotification");
const TblBook = require("../models/TblBook");
const formatDate = (date) => {
  return date ? new Date(date).toISOString().split("T")[0] : null;
};

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

    // Convert facility to an array of numeric IDs.
    const facilityIds = Array.isArray(facility)
      ? facility.map(Number)
      : facility.split(",").map((id) => Number(id.trim()));

    // **Step 2: Ensure `standard_rules` is a Proper JSON Object**
    let parsedStandardRules;
    try {
      parsedStandardRules =
        typeof standard_rules === "object"
          ? standard_rules
          : JSON.parse(standard_rules);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON format in standard_rules" });
    }

    // **Step 3: Make Sure Sequelize Receives a Valid JSON Object**
    if (typeof parsedStandardRules !== "object") {
      return res.status(400).json({ error: "standard_rules must be a valid JSON object" });
    }
    // Ensure `rules` is stored as a valid JSON array
    let parsedRules;
    try {
      parsedRules = typeof rules === "object" ? rules : JSON.parse(rules);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON format in rules" });
    }

    // **Step 4: Start Transaction**
    const transaction = await sequelize.transaction();
    try {
      let property;

      if (id) {
        // **Step 5: Fetch Property for Update**
        property = await Property.findByPk(id);
        if (!property) {
          return res.status(404).json({ error: "Property not found" });
        }

        // **Step 6: Update Property**
        await property.update(
          {
            title,
            image,
            price,
            is_panorama,
            status,
            address,
            facility: facilityIds, // Use facilityIds array here
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
            rules: parsedRules,
            country_id,
            plimit,
            is_sell,
            adults,
            children,
            infants,
            pets,
            setting_id,
            extra_guest_charges,
            standard_rules: parsedStandardRules,
          },
          { transaction }
        );
      } else {
        // **Step 7: Create New Property**
        property = await Property.create(
          {
            title,
            image,
            price,
            is_panorama,
            status,
            address,
            facility: facilityIds, // Use facilityIds array here, not the original facility value
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
            rules: parsedRules,
            country_id,
            plimit,
            is_sell,
            adults,
            children,
            infants,
            pets,
            setting_id,
            extra_guest_charges,
            standard_rules: parsedStandardRules, // Ensure JSON Object, Not String
          },
          { transaction }
        );
      }

      // **Step 8: Commit Transaction**
      await transaction.commit();
      return res.status(200).json({ message: id ? "Property updated successfully" : "Property added successfully", property });
    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ error: "Database operation failed", details: error.message });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

// Get All Properties
// const getAllProperties = async (req, res) => {
//   try {
//     const properties = await Property.findAll({
//       include: [
//         {
//           model: TblCategory,
//           as: "category",
//           attributes: ["title"],
//         },
//         {
//           model: TblCity,
//           as: "cities",
//           attributes: ["title"],
//           include: [
//             {
//               model: TblCountry,
//               as: "country",
//               attributes: ["title"],
//             },
//           ],
//         },
//       ],
//     });

//     const formattedProperties = properties.map((property) => {
//       const facilityIds = property.facility
//         ? property.facility
//             .split(",")
//             .map((id) => parseInt(id, 10))
//             .filter((id) => Number.isInteger(id))
//         : [];

//       // Fetch facilities if applicable
//       const facilities = facilityIds.length ? 
//         TblFacility.findAll({
//           where: { id: facilityIds },
//           attributes: ["id", "title"],
//         }) 
//         : [];

//       // Format city name with country
//       const cityWithCountry =
//         property.city && property.city.country
//           ? `${property.city.title} (${property.city.country.title})`
//           : property.city?.title || "";

//       // Format the listing date
//       const formattedListingDate = property.listing_date
//         ? formatDate(property.listing_date)
//         : null;

//       // **Ensure `standard_rules` is in correct format**
//       let formattedStandardRules = "N/A";
//       if (property.standard_rules && typeof property.standard_rules === "object") {
//         formattedStandardRules = `checkIn:${property.standard_rules.checkIn || "N/A"}, checkOut:${property.standard_rules.checkOut || "N/A"}, smokingAllowed:${property.standard_rules.smokingAllowed !== undefined ? property.standard_rules.smokingAllowed : "N/A"}`;
//       }

//       return {
//         ...property.toJSON(),
//         facilities,
//         city: cityWithCountry,
//         listing_date: formattedListingDate,
//         formatted_standard_rules: formattedStandardRules, // ✅ Send correctly formatted standard_rules
//       };
//     });

//     res.status(200).json(formattedProperties);
//   } catch (error) {
//     console.error("Error fetching properties:", error);
//     res.status(500).json({ error: "Internal server error", details: error.message });
//   }
// };

const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      where:{status:1},
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
        let facilityIds = [];
        if (property.facility) {
          if (typeof property.facility === "string") {
            // If it's a string, split by commas
            facilityIds = property.facility
              .split(",")
              .map((id) => parseInt(id, 10))
              .filter((id) => Number.isInteger(id));
          } else if (Array.isArray(property.facility)) {
            // If it's already an array, use it directly
            facilityIds = property.facility;
          } else if (typeof property.facility === "number") {
            // If it's a single number, wrap it in an array
            facilityIds = [property.facility];
          }
        }

        // Fetch facilities if applicable (resolve the promise)
        let facilities = [];
        if (facilityIds.length) {
          facilities = await TblFacility.findAll({
            where: { id: facilityIds },
            attributes: ["id", "title"],
          });
        }

        // Format city name with country
        const cityWithCountry =
          property.city && property.city.country
            ? `${property.city.title} (${property.city.country.title})`
            : property.city?.title || "";

        // Format the listing date
        const formattedListingDate = property.listing_date
          ? formatDate(property.listing_date)
          : null;

        // Ensure standard_rules is formatted correctly
        let formattedStandardRules = "N/A";
        if (
          property.standard_rules &&
          typeof property.standard_rules === "object"
        ) {
          formattedStandardRules = `checkIn: ${property.standard_rules.checkIn || "N/A"}, checkOut: ${property.standard_rules.checkOut || "N/A"}, smokingAllowed: ${
            property.standard_rules.smokingAllowed !== undefined
              ? property.standard_rules.smokingAllowed
              : "N/A"
          }`;
        }

        return {
          ...property.toJSON(),
          facilities,
          city: cityWithCountry,
          listing_date: formattedListingDate,
          formatted_standard_rules: formattedStandardRules,
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


const requestProperties = async (req, res) => {
  
  try {
    const properties = await Property.findAll({
      where:{status:0,
        add_user_id: { [Op.ne]: null },
       },
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
        let facilityIds = [];
        if (property.facility) {
          if (typeof property.facility === "string") {
            // If it's a string, split by commas
            facilityIds = property.facility
              .split(",")
              .map((id) => parseInt(id, 10))
              .filter((id) => Number.isInteger(id));
          } else if (Array.isArray(property.facility)) {
            // If it's already an array, use it directly
            facilityIds = property.facility;
          } else if (typeof property.facility === "number") {
            // If it's a single number, wrap it in an array
            facilityIds = [property.facility];
          }
        }

        // Fetch facilities if applicable (resolve the promise)
        let facilities = [];
        if (facilityIds.length) {
          facilities = await TblFacility.findAll({
            where: { id: facilityIds },
            attributes: ["id", "title"],
          });
        }

        // Format city name with country
        const cityWithCountry =
          property.city && property.city.country
            ? `${property.city.title} (${property.city.country.title})`
            : property.city?.title || "";

        // Format the listing date
        const formattedListingDate = property.listing_date
          ? formatDate(property.listing_date)
          : null;

        // Ensure standard_rules is formatted correctly
        let formattedStandardRules = "N/A";
        if (
          property.standard_rules &&
          typeof property.standard_rules === "object"
        ) {
          formattedStandardRules = `checkIn: ${property.standard_rules.checkIn || "N/A"}, checkOut: ${property.standard_rules.checkOut || "N/A"}, smokingAllowed: ${
            property.standard_rules.smokingAllowed !== undefined
              ? property.standard_rules.smokingAllowed
              : "N/A"
          }`;
        }



        return {
          ...property.toJSON(),
          facilities,
          city: cityWithCountry,
          listing_date: formattedListingDate,
          formatted_standard_rules: formattedStandardRules,
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



const acceptRequestProperties = async (req, res) => {
  const { property_id, type } = req.body;

  console.log(req.body, "Request body logged"); 

  try {
   
    if (!property_id) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    // Fetch property
    const property = await Property.findOne({ where: { id: property_id } });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Fetch user
    const user = await User.findOne({ where: { id: property.add_user_id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine approval status and notification details
    const isApproved = Boolean(type);
    const status = isApproved ? 1 : 0;
    const action = isApproved ? "Approved" : "Rejected";
    const message = isApproved
      ? `Congratulations ${user.name}, Your ${property.title} has been Approved!`
      : `Sorry ${user.name}, Your ${property.title} has been Rejected!`;


    await property.update({
      accept: type,
      status: status,
    });

    // Send OneSignal notification
    const notificationContent = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_player_ids: [user.one_subscription],
      data: { user_id: user.id, type: `Property has been ${action}` },
      contents: { en: message },
      headings: { en: `Property ${action}!` },
    };

    try {
      const response = await axios.post(
        "https://onesignal.com/api/v1/notifications",
        notificationContent,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          },
        }
      );
      console.log("Notification sent:", response.data);
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError.message);
      // Optionally log this error but don't interrupt the flow
    }

    // Create notification record in the database
    await TblNotification.create({
      uid: user.id,
      datetime: new Date(),
      title: `Property ${action}`,
      description: message,
    });

    // Send success response
    return res.status(200).json({
      message: `Property ${action} successfully`,
      property_id: property.id,
    });
  } catch (error) {
    console.error("Error in acceptRequestProperties:", error.message);
    return res.status(500).json({
      error: "An unexpected error occurred",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = acceptRequestProperties;


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

    const activeBookings = await TblBook.findAll({
      where: {
        prop_id: id,
        book_status: { [Op.in]: ["Booked", "Check_in", "Confirmed"] },
      },
    })

    if (activeBookings.length > 0) {
      return res.status(400).json({
        error: "Cannot delete property with active bookings",
        activeBookingsCount: activeBookings.length,
      });
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
  requestProperties,
  acceptRequestProperties
};
