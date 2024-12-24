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
    image, // Base64 encoded image string or '0'
  } = req.body;

  const user_id = req.user.id; // Get the user ID from the authenticated user

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
    // Check if country_id exists in TblCountry
    const country = await TblCountry.findByPk(country_id);
    if (!country) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Country not found!",
      });
    }

    // Check if the property belongs to the user
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

    let updatedFields = {
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
      country_name,
    };

    // Update the property
    await property.update(updatedFields);

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Updated Successfully",
      property,
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

// Property List
const getPropertyList = async (req, res) => {
  const { uid } = req.query; // Get uid from query parameters

  if (!uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Fetch properties for the given user ID
    const properties = await Property.findAll({
      where: { add_user_id: uid },
      include: [
        {
          model: TblCategory,
          as: "category",
          attributes: ["title"],
        },
        {
          model: TblFacility,
          as: "facilities", // Assuming you have a facilities association
          attributes: ["title"],
        },
        {
          model: TblCountry,
          as: "country",
          attributes: ["title"],
        },
      ],
    });

    const propertyList = await Promise.all(
      properties.map(async (property) => {
        const facilityTitles = await TblFacility.findAll({
          where: { id: property.facility }, // Assuming facility is a comma-separated string of IDs
          attributes: ["title"],
        });

        const facilitySelect = facilityTitles
          .map((facility) => facility.title)
          .join(", ");

        // Calculate the average rating if there are completed bookings
        const completedBookings = await TblBook.findAll({
          where: {
            prop_id: property.id,
            book_status: "Completed",
            total_rate: { [Op.ne]: 0 }, // Assuming you are using Sequelize's Op for not equal
          },
        });

        let rate;
        if (completedBookings.length > 0) {
          const totalRate = completedBookings.reduce(
            (sum, booking) => sum + booking.total_rate,
            0
          );
          rate = (totalRate / completedBookings.length).toFixed(0); // Average rating
        } else {
          rate = property.rate; // Default rate if no completed bookings
        }

        return {
          id: property.id,
          title: property.title,
          property_type: property.category.title,
          property_type_id: property.ptype,
          image: property.image,
          price: property.price,
          beds: property.beds,
          plimit: property.plimit,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          is_sell: property.is_sell,
          facility_select: facilitySelect,
          rules: property.rules,
          status: property.status,
          latitude: property.latitude,
          longtitude: property.longtitude,
          mobile: property.mobile,
          is_sell: property.is_sell,
          city: property.city,
          rate: rate,
          description: property.description,
          address: property.address,
          country_name: property.country.title,
        };
      })
    );

    if (propertyList.length === 0) {
      return res.status(200).json({
        proplist: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "Property List Not Found!",
      });
    }

    res.status(200).json({
      proplist: propertyList,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property List Found!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error,
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

// Search Property
const searchProperty = async (req, res) => {
  const { keyword, uid, country_id } = req.body;

  if (!keyword || !uid || !country_id) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    console.log(
      "Searching for properties with keyword:",
      keyword,
      "uid:",
      uid,
      "country_id:",
      country_id
    );

    let properties;

    if (uid == 0) {
      properties = await Property.findAll({
        where: {
          title: { [Op.like]: `%${keyword}%` },
          country_id: country_id,
          status: 1,
          is_sell: 0,
        },
      });
    } else {
      properties = await Property.findAll({
        where: {
          title: { [Op.like]: `%${keyword}%` },
          country_id: country_id,
          add_user_id: { [Op.ne]: uid },
          status: 1,
          is_sell: 0,
        },
      });
    }

    console.log("Fetched Properties:", properties);

    if (properties.length === 0) {
      return res.status(200).json({
        search_property: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "Search Property Not Found!",
      });
    }

    const searchResults = await Promise.all(
      properties.map(async (property) => {
        // Calculate the average rating if there are completed bookings
        const completedBookings = await TblBook.findAll({
          where: {
            prop_id: property.id,
            book_status: "Completed",
            total_rate: { [Op.ne]: 0 },
          },
        });

        console.log("Completed Bookings:", completedBookings);

        let rate;
        if (completedBookings.length > 0) {
          const totalRate = completedBookings.reduce(
            (sum, booking) => sum + booking.total_rate,
            0
          );
          rate = (totalRate / completedBookings.length).toFixed(0); // Average rating
        } else {
          rate = property.rate; // Default rate if no completed bookings
        }

        // Check if the property is a favorite for the user
        const isFavorite = await TblFav.count({
          where: {
            uid: uid,
            property_id: property.id,
          },
        });

        console.log("Is Favorite:", isFavorite);

        return {
          id: property.id,
          title: property.title,
          rate: rate,
          buyorrent: property.is_sell,
          plimit: property.plimit,
          city: property.city,
          image: property.image,
          property_type: property.ptype,
          price: property.price,
          IS_FAVOURITE: isFavorite > 0 ? 1 : 0,
        };
      })
    );

    res.status(200).json({
      search_property: searchResults,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property List Found!",
    });
  } catch (error) {
    console.error(error);
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

module.exports = {
  addProperty,
  editProperty,
  getPropertyList,
  getPropertyTypes,
  searchProperty,
  getPropertyDetails,
  getAllProperties,
};
