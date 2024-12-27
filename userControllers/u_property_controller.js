const { Op, where } = require("sequelize");
const { TblCategory, TblExtra, User } = require("../models");
const Property = require("../models/Property");
const TblBook = require("../models/TblBook");
const TblCountry = require("../models/TblCountry");
const TblFacility = require("../models/TblFacility");
const TblFav = require("../models/TblFav");
const TblGallery = require("../models/TblGallery");
const TblEnquiry = require("../models/TblEnquiry");

const addProperty = async (req, res) => {
  const {
    title,
    image,
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
  } = req.body;

  const add_user_id = req.user.id; // Assuming user ID is available in req.user.id
  console.log(add_user_id);

  // Validate the necessary fields
  if (
    !add_user_id ||
    !is_sell ||
    !country_id ||
    !plimit ||
    !status ||
    !title ||
    !image ||
    !listing_date ||
    !rules ||
    !address ||
    !description ||
    !city ||
    !facility ||
    !ptype ||
    !beds ||
    !bathroom ||
    !sqrft ||
    !rate ||
    !latitude ||
    !mobile ||
    !price
  ) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Check if country_id exists in TblCountry
    const country = await TblCountry.findByPk(country_id);
    if (!country) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Country not found!",
      });
    }

    // Create new property
    const newProperty = await Property.create({
      title,
      image,
      price,
      status,
      address,
      facility,
      description,
      beds,
      bathroom,
      sqrft,
      rate,
      rules,
      ptype,
      latitude,
      longtitude,
      mobile,
      city,
      listing_date: new Date(),
      add_user_id,
      country_id,
      plimit,
      is_sell,
    });
    res.status(201).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Add Successfully",
      newProperty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const editProperty = async (req, res) => {
  const {
    status,
    title,
    address,
    description,
    ccount,
    facility,
    ptype,
    beds,
    bathroom,
    sqft,
    rate,
    rules,
    latitude,
    longtitude,
    mobile,
    listing_date,
    price,
    prop_id,
    plimit,
    country_id,
    is_sell,
    image,
  } = req.body;

  const user_id = req.user.id;

  // Validate the necessary fields
  if (
    !prop_id ||
    !is_sell ||
    !country_id ||
    !plimit ||
    !user_id ||
    !status ||
    !title ||
    !address ||
    !description ||
    !ccount ||
    !facility ||
    !ptype ||
    !beds ||
    !rules ||
    !bathroom ||
    !sqft ||
    !rate ||
    !latitude ||
    !longtitude ||
    !mobile ||
    !listing_date ||
    !price ||
    !image
  ) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Validate country
    const country = await TblCountry.findByPk(country_id);
    if (!country) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Country not found!",
      });
    }

    // Validate property ownership
    const property = await Property.findOne({
      where: { id: prop_id, add_user_id: user_id },
    });
    if (!property) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Edit Your Own Property!",
      });
    }

    // Log the fields being updated
    console.log("Property found:", property);
    console.log("Updating fields:", {
      is_sell,
      country_id,
      plimit,
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
      rules,
      ptype,
      latitude,
      longtitude,
      mobile,
      city: ccount,
      listing_date,
      image,
    });

    // Perform update
    await property.update({
      is_sell,
      country_id,
      plimit,
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
      rules,
      ptype,
      latitude,
      longtitude,
      mobile,
      city: ccount,
      listing_date,
      image,
    });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Updated Successfully",
      property,
    });
  } catch (error) {
    console.error("Error occurred:", error.message, error.stack);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const getPropertyList = async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User ID not provided",
    });
  }

  try {
    console.log("Fetching properties for user ID:", uid);

    // Fetch properties

    const properties = await Property.findAll({
      where: { add_user_id: uid },
      include: [
        { model: TblCategory, as: "category", attributes: ["title"] },
        { model: TblFacility, as: "facilities", attributes: ["title"] },
        { model: TblCountry, as: "country", attributes: ["title"] },
      ],
    });

    console.log("Fetched properties:", properties);

    const propertyList = await Promise.all(
      properties.map(async (property) => {
        console.log("Processing property:", property);

        const facilityIds = property.facility
          ? property.facility.split(",")
          : [];
        console.log("Facility IDs:", facilityIds);

        const facilityTitles = await TblFacility.findAll({
          where: { id: { [Op.in]: facilityIds } },

          attributes: ["title"],
        });

        console.log("Facility titles:", facilityTitles);

        const completedBookings = await TblBook.findAll({
          where: {
            prop_id: property.id,
            book_status: "Completed",

            total_rate: { [Op.ne]: 0 },
          },
        });

        console.log("Completed bookings:", completedBookings);

        const rate =
          completedBookings.length > 0
            ? (
                completedBookings.reduce(
                  (sum, booking) => sum + booking.total_rate,
                  0
                ) / completedBookings.length
              ).toFixed(0)
            : property.rate;

        return {
          id: property.id,
          title: property.title,
          property_type: property.category?.title || "Unknown",
          property_type_id: property.ptype,
          image: property.image,
          price: property.price,
          beds: property.beds,
          plimit: property.plimit,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          is_sell: property.is_sell,
          facility_select: facilityTitles.map((f) => f.title),
          rules: property.rules,
          status: property.status,
          latitude: property.latitude,
          longitude: property.longitude,
          mobile: property.mobile,
          city: property.city,
          rate: rate,
          description: property.description,
          address: property.address,
          country_name: property.country?.title || "Unknown",
        };
      })
    );

    if (propertyList.length === 0) {
      return res.status(200).json({
        proplist: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "No properties found",
      });
    }

    res.status(200).json({
      proplist: propertyList,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Properties found",
    });
  } catch (error) {
    console.error("Error fetching property list:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message || "Unknown error",
    });
  }
};

// Property Type List
const getPropertyTypes = async (req, res) => {
  const { ptype } = req.body;

  try {
    // Validate input
    if (!ptype) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "ptype is required!",
      });
    }

    // Fetch property types
    const typeList = await Property.findAll({
      where: {
        ptype: ptype,
        status: 1,
      },
    });

    // Check if any types are found
    if (!typeList || typeList.length === 0) {
      return res.status(404).json({
        typelist: [],
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Property Type Not Found!",
      });
    }

    // Success response
    res.status(200).json({
      typelist: typeList,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Type List Found!",
    });
  } catch (error) {
    console.error("Error in getPropertyTypes:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message,
    });
  }
};

const getPropertyDetails = async (req, res) => {
  const { pro_id, uid } = req.body; // Get data from request body
  console.log(pro_id, uid);
  if (!pro_id || !uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Invalid input data!",
    });
  }

  try {
    // Fetch property details
    const property = await Property.findOne({ where: { id: pro_id } });

    if (!property) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Property not found!",
      });
    }

    // Fetch extra images
    const extraImages = await TblExtra.findAll({
      where: { pid: property.id },
      attributes: ["status"], // Ensure column name matches your schema
    });

    // Fetch completed bookings for rating
    const completedBookings = await TblBook.findAll({
      where: {
        prop_id: property.id,
        book_status: "Completed",
        total_rate: { [Op.ne]: 0 },
      },
    });

    const rate =
      completedBookings.length > 0
        ? (
            completedBookings.reduce(
              (sum, booking) => sum + booking.total_rate,
              0
            ) / completedBookings.length
          ).toFixed(2)
        : property.rate;

    // Fetch owner details
    let ownerImage = "images/property/owner.jpg";
    let ownerName = "Host";

    if (property.add_user_id !== 0) {
      const ownerData = await User.findOne({
        where: { id: property.add_user_id },
        attributes: ["pro_pic", "name"],
      });
      ownerImage = ownerData?.pro_pic || ownerImage;
      ownerName = ownerData?.name || ownerName;
    }

    // Fetch facilities
    const facilities = await TblFacility.findAll({
      where: {
        id: { [Op.in]: property.facility.split(",") },
      },
      attributes: ["img", "title"],
    });

    // Fetch gallery images
    const galleryImages = await TblGallery.findAll({
      where: { pid: property.id },
      limit: 5,
      attributes: ["img"],
    });

    // Check if the property is a favorite for the user
    const isFavorite = await TblFav.count({
      where: { uid: uid, property_id: property.id },
    });

    // Fetch reviews
    const reviews = await TblBook.findAll({
      where: { prop_id: pro_id, book_status: "Completed", is_rate: 1 },
      limit: 3,
    });

    const reviewList = await Promise.all(
      reviews.map(async (review) => {
        const userData = await TblUser.findOne({
          where: { id: review.uid },
          attributes: ["pro_pic", "name"],
        });
        return {
          user_img: userData?.pro_pic || null,
          user_title: userData?.name || null,
          user_rate: review.total_rate,
          user_desc: review.rate_text,
        };
      })
    );

    const totalReviewCount = await TblBook.count({
      where: { prop_id: pro_id, book_status: "Completed", is_rate: 1 },
    });

    // Construct the response
    const response = {
      propetydetails: {
        id: property.id,
        user_id: property.add_user_id,
        title: property.title,
        rate: rate,
        city: property.city,
        image: extraImages.map((img) => ({ is_panorama: img.extra_image })), // Adjusted to match your schema
        property_type: property.ptype,
        property_title: await TblCategory.findOne({
          where: { id: property.ptype },
          attributes: ["title"],
        }),
        price: property.price,
        buyorrent: property.pbuysell,
        is_enquiry: await TblEnquiry.count({
          where: { prop_id: property.id, uid: uid },
        }),
        address: property.address,
        beds: property.beds,
        owner_image: ownerImage,
        owner_name: ownerName,
        bathroom: property.bathroom,
        sqrft: property.sqrft,
        description: property.description,
        latitude: property.latitude,
        mobile: property.mobile,
        plimit: property.plimit,
        longtitude: property.longtitude,
        IS_FAVOURITE: isFavorite > 0,
      },
      facility: facilities,
      gallery: galleryImages.map((img) => img.img),
      reviewlist: reviewList,
      total_review: totalReviewCount,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property details fetched successfully!",
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message,
    });
  }
};

const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({ where: { status: 1 } });

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Properties not found!",
      });
    }

    res.status(200).json({
      properties: properties,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Properties fetched successfully!",
    });
  } catch (error) {
    console.error("Error in getAllProperties:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message,
    });
  }
};

const searchPropertyByLocationAndDate = async (req, res) => {
  try {
    const { location, check_in, check_out } = req.query;

    if (!location && (!check_in || !check_out)) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "City or Date range is required.",
      });
    }

    // Query for properties
    let propertyFilter = { status: 1 }; // Only active properties
    if (location) {
      propertyFilter.city = { [Op.like]: `%${location}%` }; // Using 'city' with Op.like
    }

    let properties = await Property.findAll({
      where: propertyFilter,
    });

    if (check_in && check_out) {
      // Filter properties by availability based on booking dates
      const availablePropertyIds = [];
      for (const property of properties) {
        const bookings = await TblBook.findAll({
          where: {
            prop_id: property.id,
            book_status: { [Op.ne]: "Cancelled" },
            [Op.or]: [
              {
                check_in: { [Op.between]: [check_in, check_out] },
              },
              {
                check_out: { [Op.between]: [check_in, check_out] },
              },
            ],
          },
        });

        if (bookings.length === 0) {
          availablePropertyIds.push(property.id);
        }
      }

      // Filter properties based on availability
      properties = properties.filter((property) =>
        availablePropertyIds.includes(property.id)
      );
    }

    if (!properties.length) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No properties found for the given criteria.",
      });
    }

    return res.status(200).json({
      properties,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Properties fetched successfully!",
    });
  } catch (error) {
    console.error("Error in searchPropertyByLocationAndDate:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  addProperty,
  editProperty,
  getPropertyList,
  getPropertyTypes,
  getPropertyDetails,
  getAllProperties,
  searchPropertyByLocationAndDate,
};
