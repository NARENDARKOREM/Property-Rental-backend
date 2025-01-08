const { Op, where, literal } = require("sequelize");
const { TblCategory, TblExtra, User, PriceCalendar } = require("../models");
const Property = require("../models/Property");
const TblBook = require("../models/TblBook");
const TblCountry = require("../models/TblCountry");
const TblFacility = require("../models/TblFacility");
const TblFav = require("../models/TblFav");
const TblGallery = require("../models/TblGallery");
const TblEnquiry = require("../models/TblEnquiry");
const Setting = require("../models/Setting");
const TblExtraImage = require("../models/TableExtraImages");

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
    is_sell,
    adults,
    children,
    infants,
    pets,
    setting_id,
  } = req.body;

  const add_user_id = req.user.id;
  if (!add_user_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User ID not provided",
    });
  }

  console.log(add_user_id);

  // Validate the necessary fields
  if (
    !is_sell ||
    !country_id ||
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
      ResponseMsg: "Fields Required!",
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
      facility: JSON.stringify(facility),
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
      is_sell,
      adults,
      children,
      infants,
      pets,
      setting_id,
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
  try {
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
      country_id,
      is_sell,
      image,
      adults,
      children,
      infants,
      pets,
      setting_id,
    } = req.body;

    console.log("Request Body:", req.body);

    // Check if the user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Authorization failed: User ID missing",
      });
    }

    const user_id = req.user.id;

    // Validate required fields
    if (
      !prop_id ||
      !status ||
      !title ||
      !address ||
      !description ||
      !ccount ||
      !facility ||
      !ptype ||
      !beds ||
      !bathroom ||
      !sqft ||
      !rate ||
      !rules ||
      !latitude ||
      !longtitude ||
      !mobile ||
      !listing_date ||
      !price ||
      !image ||
      !plimit ||
      !country_id ||
      is_sell === undefined // Ensure boolean is not `undefined`
    ) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Missing or invalid fields",
      });
    }

    // Validate JSON parsing for `facility` and `rules`
    let parsedFacility;
    let parsedRules;
    try {
      parsedFacility = JSON.parse(facility);
      parsedRules = JSON.parse(rules);
    } catch (err) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid JSON format in facility or rules",
      });
    }

    // Check if the country exists
    const country = await TblCountry.findByPk(country_id);
    if (!country) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Country not found!",
      });
    }

    // Check if the property exists and belongs to the user
    const property = await Property.findOne({
      where: { id: prop_id, add_user_id: user_id },
    });
    if (!property) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "You can only edit your own properties",
      });
    }

    // Update the property
    await property.update({
      is_sell,
      country_id,
      status,
      title,
      price,
      address,
      facility: JSON.stringify(parsedFacility),
      description,
      beds,
      bathroom,
      sqrft: sqft,
      rate,
      rules: JSON.stringify(parsedRules),
      ptype,
      latitude,
      longtitude,
      mobile,
      city: ccount,
      listing_date,
      image,
      adults,
      children,
      infants,
      pets,
      setting_id,
    });

    // Return success response
    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Updated Successfully",
      property,
    });
  } catch (error) {
    console.error("Error occurred:", error.message, error.stack);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const getPropertyList = async (req, res) => {
  try {
    const uid = req.user.id;

    if (!uid) {
      return res.status(400).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User ID not provided",
      });
    }

    console.log("Fetching properties for user ID:", uid);

    // Fetch properties

    const properties = await Property.findAll({
      where: { add_user_id: uid, status: 1 },
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
          setting_id: property.setting_id,
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
      include: [
        {
          model: TblCategory,
          as: "category",
          attributes: ["title"],
        },
        {
          model: TblFacility,
          as: "facilities",
          attributes: ["title"],
        },
        {
          model: TblCountry,
          as: "country",
          attributes: ["title"],
        },
      ],
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

    const formattedProperties = await Promise.all(
      typeList.map(async (property) => {
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

    // Success response
    res.status(200).json({
      typelist: formattedProperties,
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
  const uid = req.user?.id || null;
  const { pro_id } = req.body;

  if (!pro_id) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Invalid input data!",
    });
  }

  try {
    const property = await Property.findOne({
      where: { id: pro_id },
    });

    if (!property) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Property not found!",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    console.log(today, "from calendar tableeeeee");
    const priceEntry = await PriceCalendar.findOne({
      where: {
        prop_id: pro_id,
      },
    });

    console.log(priceEntry, "from calanderrrrrrrrrrrr ");

    const previousPrice = priceEntry ? priceEntry.price : property.price;

    const rulesArray = JSON.parse(property.rules);
    const extraImages = await TblExtra.findAll({
      where: { pid: property.id },
      include: [{ model: TblExtraImage, as: "images", attributes: ["url"] }],
      attributes: ["status"],
    });

    const completedBookings = await TblBook.findAll({
      where: {
        prop_id: property.id,
        book_status: "Completed",
        total_rate: { [Op.ne]: 0 },
      },
    });

    const category = await TblCategory.findOne({
      where: { id: property.ptype },
      attributes: ["title"],
    });

    const settings = await Setting.findOne({
      where: { id: property.setting_id },
      attributes: ["cancellation_policy"],
      paranoid: false,
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

    let ownerDetails = null;
    if (property.add_user_id !== 0) {
      ownerDetails = await User.findOne({
        where: { id: property.add_user_id },
        attributes: ["id", "pro_pic", "name", "email", "mobile"],
      });
    }

    const facilities = await TblFacility.findAll({
      where: {
        id: { [Op.in]: property.facility.split(",") },
      },
      attributes: ["img", "title"],
    });

    const isFavorite = await TblFav.count({
      where: { uid: uid, property_id: property.id },
    });

    const reviews = await TblBook.findAll({
      where: {
        prop_id: pro_id,
        book_status: ["Completed", "Confirmed"],
        is_rate: 1,
      },
      limit: 3,
    });

    const reviewList = await Promise.all(
      reviews.map(async (review) => {
        const userData = await User.findOne({
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

    const propertyImage = property.image;
    const panoramaStatus = property.is_panorama;
    const gallery = extraImages.flatMap((extraImage) =>
      extraImage.images.map((image) => image.url)
    );

    const response = {
      propetydetails: {
        id: property.id,
        title: property.title,
        rate: rate,
        city: property.city,
        image: [{ image: propertyImage, is_panorama: panoramaStatus }],
        property_type: property.ptype,
        property_title: category?.title,
        price: previousPrice,
        buyorrent: property.pbuysell,
        address: property.address,
        beds: property.beds,
        bathroom: property.bathroom,
        rules: rulesArray,
        sqrft: property.sqrft,
        description: property.description,
        latitude: property.latitude,
        mobile: property.mobile,
        longtitude: property.longtitude,
        adults: property.adults,
        children: property.children,
        infants: property.infants,
        pets: property.pets,
        cancellation_policy:
          settings?.cancellation_policy || "No cancellation policy available",
        IS_FAVOURITE: isFavorite > 0,
        owner: ownerDetails
          ? {
              id: ownerDetails.id,
              name: ownerDetails.name,
              pro_pic: ownerDetails.pro_pic,
              email: ownerDetails.email,
              phone: ownerDetails.mobile,
            }
          : null,
      },
      facility: facilities,
      gallery: gallery,
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
      stack: error.stack,
    });
  }
};

const getAllProperties = async (req, res) => {
  // User added Properties
  const uid = req.user?.id;
  if (!uid) {
    return res.status(404).json({ message: "User not found!" });
  }
  try {
    const properties = await Property.findAll({
      where: { status: 1, add_user_id: uid },
      include:{model:PriceCalendar,as:"priceCalendars", attributes:["date","note","prop_id","price"]}
    });

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Properties not found!",
      });
    }

    const ownerDetails = await User.findOne({
      where: { id: uid },
      attributes: ["id", "pro_pic", "name", "email", "mobile"],
    });

    if (!ownerDetails) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "False",
        ResponseMsg: "Owner not found!",
      });
    }

    const propertiesWithProcessedRules = properties.map((property) => {
      if (typeof property.rules === "string") {
        try {
          const parsedRules = JSON.parse(property.rules);
          if (Array.isArray(parsedRules)) {
            property.rules = parsedRules.join(", ");
          } else {
            property.rules = property.rules
              .split(",")
              .map((rule) => rule.trim())
              .join(", ");
          }
        } catch (error) {
          console.error("Error parsing rules:", error);
        }
      } else if (Array.isArray(property.rules)) {
        property.rules = property.rules.join(", ");
      }
      return property;
    });

    res.status(200).json({
      properties: propertiesWithProcessedRules,
      owner: {
        id: ownerDetails.id,
        name: ownerDetails.name,
        email: ownerDetails.email,
        phone: ownerDetails.mobile,
      },
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

const getSortedProperties = async (req, res) => {
  try {
    const { sort } = req.params;
    const { id } = req.body;

    if (!sort || !["asc", "desc"].includes(sort.toLowerCase())) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid sort parameter. Use 'asc' or 'desc'.",
      });
    }

    if (id === 0) {
      // Fetch and sort properties based on price
      const properties = await Property.findAll({
        where: { status: 1 },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["price", sort.toLowerCase()]],
      });

      if (!properties.length) {
        return res.status(200).json({
          typelist: [],
          ResponseCode: "200",
          Result: "false",
          ResponseMsg: "No properties found",
        });
      }

      console.log("Fetched and sorted properties:", properties);

      // Map through properties to enrich with additional details
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

      // Send the response
      res.status(200).json({
        typelist: formattedProperties,
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Sorted properties found",
      });
    } else {
      // Fetch and sort properties based on price
      const properties = await Property.findAll({
        where: { status: 1, ptype: id },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["price", sort.toLowerCase()]],
      });

      if (!properties.length) {
        return res.status(200).json({
          typelist: [],
          ResponseCode: "200",
          Result: "false",
          ResponseMsg: "No properties found",
        });
      }

      console.log("Fetched and sorted properties:", properties);

      // Map through properties to enrich with additional details
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

      // Send the response
      res.status(200).json({
        typelist: formattedProperties,
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Sorted properties found",
      });
    }
  } catch (error) {
    console.error("Error fetching sorted properties:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message || "Unknown error",
    });
  }
};
const getSortedPropertiestitle = async (req, res) => {
  try {
    const { sort } = req.params;
    const { id } = req.body;

    if (!sort || !["asc", "desc"].includes(sort.toLowerCase())) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid sort parameter. Use 'asc' or 'desc'.",
      });
    }
    if (id === 0) {
      // Fetch and sort properties based on price
      const properties = await Property.findAll({
        where: { status: 1 },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["title", sort.toLowerCase()]],
      });

      if (!properties.length) {
        return res.status(200).json({
          typelist: [],
          ResponseCode: "200",
          Result: "false",
          ResponseMsg: "No properties found",
        });
      }

      console.log("Fetched and sorted properties:", properties);

      // Map through properties to enrich with additional details
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

      // Send the response
      res.status(200).json({
        typelist: formattedProperties,
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Sorted properties found",
      });
    } else {
      if (id) {
        const properties = await Property.findAll({
          where: { status: 1, ptype: id },
          include: [
            { model: TblCategory, as: "category", attributes: ["title"] },
            { model: TblFacility, as: "facilities", attributes: ["title"] },
            { model: TblCountry, as: "country", attributes: ["title"] },
          ],
          order: [["title", sort.toLowerCase()]],
        });

        if (!properties.length) {
          return res.status(200).json({
            typelist: [],
            ResponseCode: "200",
            Result: "false",
            ResponseMsg: "No properties found",
          });
        }

        console.log("Fetched and sorted properties:", properties);

        // Map through properties to enrich with additional details
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

        // Send the response
        res.status(200).json({
          typelist: formattedProperties,
          ResponseCode: "200",
          Result: "true",
          ResponseMsg: "Sorted properties found",
        });
      }
    }
  } catch (error) {
    console.error("Error fetching sorted properties:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message || "Unknown error",
    });
  }
};

const searchPropertyByLocationAndDate = async (req, res) => {
  try {
    const { location, check_in, check_out } = req.body;

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

const searchProperties = async (req, res) => {
  try {
    const { location, check_in, check_out, adults, children, infants, pets } =
      req.body;

    const uid = req.user?.id || null;

    if (!location) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Location is required",
      });
    }

    // Initial property filter based on location and active status
    let propertyFilter = { status: 1 };
    if (location) {
      propertyFilter.city = { [Op.like]: `%${location}%` };
    }

    // Fetch properties matching location criteria
    let properties = await Property.findAll({ where: propertyFilter });

    if (check_in && check_out) {
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
              {
                [Op.and]: [
                  { check_in: { [Op.lt]: check_in } },
                  { check_out: { [Op.gt]: check_out } },
                ],
              },
            ],
          },
        });

        // Add property to available list if no bookings conflict
        if (bookings.length === 0) {
          availablePropertyIds.push(property.id);
        }
      }

      // Filter properties to only include available ones
      properties = properties.filter((property) =>
        availablePropertyIds.includes(property.id)
      );
    }

    // Further filter properties based on guest details
    if (adults || children || infants || pets) {
      properties = properties.filter(
        (property) =>
          property.adults >= (adults || 0) &&
          property.children >= (children || 0) &&
          property.infants >= (infants || 0) &&
          property.pets >= (pets || 0)
      );
    }

    let favoriteProperties = [];
    if (uid) {
      favoriteProperties = await TblFav.findAll({
        where: { uid: uid },
        attributes: ["property_id"],
      }).then((favs) => favs.map((fav) => fav.property_id));
    }

    // Return response if no properties found
    if (!properties.length) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No properties found for the given criteria.",
      });
    }

    const searchedProperties = properties.map((property) => ({
      id: property.id,
      title: property.title,
      rate: property.rate,
      adults: property.adults,
      children: property.children,
      infants: property.infants,
      pets: property.pets,
      city: property.city,
      image: property.image,
      propertyType: property.ptype,
      price: property.price,
      favorite: favoriteProperties.includes(property.id) ? 1 : 0,
    }));

    // Return matched properties
    return res.status(200).json({
      searchedProperties,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Properties fetched successfully!",
    });
  } catch (error) {
    console.error("Error in searchProperties:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      error: error.message,
    });
  }
};

const deleteUserProperty = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).message({ message: "User not found!" });
  }
  try {
    const propertyId = req.params.propertyId;
    if (!propertyId) {
      return res.status(400).json({ message: "Property Id is required!" });
    }
    const property = await Property.findOne({
      where: { id: propertyId, add_user_id: uid },
    });
    if (!property) {
      return res.status(404).json({
        message: "Property not found or you don't have permission to delete!",
      });
    }
    await Property.destroy({ where: { id: propertyId } });
    return res.status(200).json({ message: "Property deleted successfully!" });
  } catch (error) {
    console.error(object);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting the property!" });
  }
};

const nearByProperties = async (req, res) => {
  const { latitude, longitude, maxDistance, id } = req.body;

  if (!latitude || !longitude || !maxDistance) {
    return res.status(400).json({
      ResponseCode: "400",
      Result: "false",
      ResponseMsg: "Latitude, longitude, and maxDistance are required.",
    });
  }

  try {
    if (id !== 0) {
      const nearbyProperties = await Property.findAll({
        attributes: {
          include: [
            [
              literal(`
              6371 * acos(
                cos(radians(:latitude))
                * cos(radians(latitude))
                * cos(radians(longtitude) - radians(:longitude))
                + sin(radians(:latitude)) * sin(radians(latitude))
              )
            `),
              "distance",
            ],
          ],
        },
        where: {
          // Add filtering by calculated distance
          [Op.and]: [
            literal(`
            6371 * acos(
              cos(radians(:latitude))
              * cos(radians(latitude))
              * cos(radians(longtitude) - radians(:longitude))
              + sin(radians(:latitude)) * sin(radians(latitude))
            ) < :maxDistance
          `),
          ],
          ptype: id,
        },
        order: [
          // Order results by proximity (ascending distance)
          [literal("distance"), "ASC"],
        ],
        replacements: {
          latitude,
          longitude,
          maxDistance,
        },
      });

      if (nearbyProperties.length === 0) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "No nearby properties found.",
        });
      }

      return res.status(200).json({
        typelist: nearbyProperties,
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Nearby properties found.",
      });
    } else {
      const nearbyProperties = await Property.findAll({
        attributes: {
          include: [
            [
              literal(`
              6371 * acos(
                cos(radians(:latitude))
                * cos(radians(latitude))
                * cos(radians(longtitude) - radians(:longitude))
                + sin(radians(:latitude)) * sin(radians(latitude))
              )
            `),
              "distance",
            ],
          ],
        },
        where: {
          // Add filtering by calculated distance
          [Op.and]: [
            literal(`
            6371 * acos(
              cos(radians(:latitude))
              * cos(radians(latitude))
              * cos(radians(longtitude) - radians(:longitude))
              + sin(radians(:latitude)) * sin(radians(latitude))
            ) < :maxDistance
          `),
          ],
        },
        order: [
          // Order results by proximity (ascending distance)
          [literal("distance"), "ASC"],
        ],
        replacements: {
          latitude,
          longitude,
          maxDistance,
        },
      });

      if (nearbyProperties.length === 0) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "No nearby properties found.",
        });
      }

      return res.status(200).json({
        typelist: nearbyProperties,
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Nearby properties found.",
      });
    }
  } catch (error) {
    console.error("Error fetching nearby properties:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal server error.",
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
  getSortedProperties,
  getSortedPropertiestitle,
  searchPropertyByLocationAndDate,
  searchProperties,
  deleteUserProperty,
  nearByProperties,
};
