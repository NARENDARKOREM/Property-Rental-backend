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
const uploadToS3 = require("../config/fileUpload.aws");
const TravelerHostReview = require("../models/TravelerHostReview");

const addProperty = async (req, res) => {
  const {
    title,
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
    standard_rules,
    extra_guest_charges
  } = req.body;

  const files = req.files; // Extract uploaded files
  const add_user_id = req.user.id;

  if (!add_user_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User ID not provided",
    });
  }

  if (
    !is_sell ||
    !country_id ||
    !status ||
    !title ||
    !listing_date ||
    !rules ||
    !standard_rules ||
    !address ||
    !description ||
    !city ||
    !facility ||
    !ptype ||
    !beds ||
    !bathroom ||
    !sqrft ||
    // !rate ||
    !latitude ||
    !mobile ||
    !price ||
    !files ||
    !files.main_image
  ) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "All fields and at least the main image are required!",
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

    const standardRules = JSON.parse(standard_rules);
    const facilityIds = Array.isArray(facility)
      ? facility  
      : facility.split(",").map((id) => parseInt(id));   

    // Separate main image
    const mainImage = files.main_image[0]; // Single main image file

    // Separate extra images and videos based on MIME type
    const extraImages = [];
    const videos = [];

    if (files.extra_files) {
      files.extra_files.forEach((file) => {
        if (file.mimetype.startsWith("image/")) {
          extraImages.push(file);
        } else if (file.mimetype.startsWith("video/")) {
          videos.push(file);
        }
      });
    }

    // Upload files to S3
    const mainImageUrl = await uploadToS3([mainImage], "property-main-image");
    const extraImageUrls = extraImages.length
      ? await uploadToS3(extraImages, "property-extra-images")
      : [];
    const videoUrls = videos.length
      ? await uploadToS3(videos, "property-videos")
      : [];

    // Create new property
    const newProperty = await Property.create({
      title,
      image: mainImageUrl, // Store main image URL
      extra_images: JSON.stringify(extraImageUrls), // Store extra images as JSON array
      video: JSON.stringify(videoUrls), // Store video URLs as JSON array
      price,
      status,
      address,
      facility: JSON.stringify(facilityIds),
      description,
      beds,
      bathroom,
      sqrft,
      rate,
      rules,
      standard_rules: standardRules,
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
      extra_guest_charges
    });

    res.status(201).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property added successfully!",
      newProperty,
    });
  } catch (error) {
    console.error("Error adding property:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const editProperty = async (req, res) => {
  try {
    // Destructure fields from req.body
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
      sqrft,
      rate,
      rules,
      standard_rules,
      latitude,
      longtitude,
      mobile,
      listing_date,
      price,
      prop_id,
      country_id,
      is_sell,
      adults,
      children,
      infants,
      pets,
      setting_id,
      extra_guest_charges
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

    const files = req.files; // Extract uploaded files
    const user_id = req.user.id;

    const standardRules = JSON.parse(standard_rules);

    // Validate required fields
    const missingFields = [];

    if (!prop_id) missingFields.push("prop_id");
    if (!status) missingFields.push("status");
    if (!title) missingFields.push("title");
    if (!address) missingFields.push("address");
    if (!description) missingFields.push("description");
    if (!facility) missingFields.push("facility");
    if (!ptype) missingFields.push("ptype");
    if (!beds) missingFields.push("beds");
    if (!bathroom) missingFields.push("bathroom");
    if (!sqrft) missingFields.push("sqrft");
    if (!rate) missingFields.push("rate");
    if (!rules) missingFields.push("rules");
    if (!latitude) missingFields.push("latitude");
    if (!longtitude) missingFields.push("longtitude");
    if (!mobile) missingFields.push("mobile");
    if (!listing_date) missingFields.push("listing_date");
    if (!price) missingFields.push("price");
    if (!country_id) missingFields.push("country_id");
    if (is_sell === undefined) missingFields.push("is_sell");
    if (!files || (!files.main_image && !files.extra_files)) missingFields.push("files");
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: `Missing or invalid fields: ${missingFields.join(", ")}`,
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

    // Separate main image
    const mainImage = files.main_image ? files.main_image[0] : null;

    // Separate extra images and videos based on MIME type
    const extraImages = [];
    const videos = [];
    if (files.extra_files) {
      files.extra_files.forEach((file) => {
        if (file.mimetype.startsWith("image/")) {
          extraImages.push(file);
        } else if (file.mimetype.startsWith("video/")) {
          videos.push(file);
        }
      });
    }

    // Upload files to S3
    const mainImageUrl = mainImage
      ? await uploadToS3([mainImage], "property-main-image")
      : property.image; // Keep the existing main image if no new one is provided
    const extraImageUrls = extraImages.length
      ? await uploadToS3(extraImages, "property-extra-images")
      : JSON.parse(property.extra_images || "[]");
    const videoUrls = videos.length
      ? await uploadToS3(videos, "property-videos")
      : JSON.parse(property.video || "[]");

    // Update the property
    await property.update({
      is_sell,
      country_id,
      status,
      title,
      image: mainImageUrl[0] || property.image, // Update main image URL
      extra_images: JSON.stringify(extraImageUrls), // Update extra images
      video: JSON.stringify(videoUrls), // Update videos
      price,
      address,
      facility,
      description,
      beds,
      bathroom,
      sqrft: sqrft,
      rate,
      rules,
      standard_rules: standardRules,
      ptype,
      latitude,
      longtitude,
      mobile,
      city: ccount,
      listing_date,
      adults,
      children,
      infants,
      pets,
      setting_id,
      extra_guest_charges
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
        ResponseMsg: "User  ID not provided",
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

        // Parse standard_rules from JSON string to object
        const standardRules = property.standard_rules
          ? JSON.parse(property.standard_rules)
          : null;
        console.log(
          "standard rulessssssssssssssssssssss: ",
          JSON.stringify(standardRules)
        );
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

            const extraImages = property.extra_images
            ? JSON.parse(property.extra_images)
            : [];
          console.log("Extra Images:", extraImages);

          const videoUrl = property.video ? JSON.parse(property.video)[0] : null;
        console.log("Video URL:", videoUrl);

        return {
          id: property.id,
          title: property.title,
          property_type: property.category?.title || "Unknown",
          property_type_id: property.ptype,
          image: property.image,
          price: property.price,
          beds: property.beds,
          // plimit: property.plimit,
          adults: property.adults,
          children: property.children,
          infants: property.infants,
          pets: property.pets,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          is_sell: property.is_sell,
          // facility_select: facilityTitles.map((f) => f.title),
          facility: facilityIds,
          standard_rules: standardRules, // This will now be a JSON object
          rules: property.rules,
          status: property.status,
          latitude: property.latitude,
          longtitude: property.longtitude,
          mobile: property.mobile,
          city: property.city,
          rate: rate,
          description: property.description,
          address: property.address,
          country_name: property.country?.title || "Unknown",
          setting_id: property.setting_id,
          extra_images:extraImages,
          video:videoUrl,
          extra_guest_charges:property.extra_guest_charges
        };
      })
    );

    console.log(propertyList, "propertiesssssssssssssssssssssssssssss");

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

    const standardRules = property.standard_rules
      ? JSON.parse(property.standard_rules)
      : null;

    // const today = new Date().toISOString().split("T")[0];
    // const originalPrice = property.price;

    // // Fetch the price entry for today or the most recent calendar price
    // const priceEntry = await PriceCalendar.findOne({
    //   where: {
    //     prop_id: pro_id,
    //   },
    // });

    // const currentPrice = priceEntry ? priceEntry.price : originalPrice;

    // // Fetch upcoming prices from the calendar
    // const upcomingPrices = await PriceCalendar.findAll({
    //   where: {
    //     prop_id: pro_id,
    //     date: { [Op.gt]: today }, // Only fetch future dates
    //   },
    //   attributes: ["date", "price"], // Include only necessary fields
    //   order: [["date", "ASC"]], // Sort by date
    // });

    // const upcomingPricesArray = upcomingPrices.map((entry) => ({
    //   date: entry.date,
    //   price: entry.price,
    // }));

    // const price = upcomingPricesArray.length > 0 
    // ? {
    //     originalPrice,
    //     currentPrice,
    //     upcomingPrices: upcomingPricesArray,
    //   } 
    // : originalPrice;

    const today = new Date().toISOString().split("T")[0];
    const originalPrice = property.price;

    // Fetch the price entry for today or the most recent calendar price
    const upcomingPrices = await PriceCalendar.findAll({
      where: {
        prop_id: pro_id,
      },
      attributes: ["date", "price"],
      order: [["date", "ASC"]],
    });

    let currentPrice = originalPrice;

    for (let entry of upcomingPrices) {
      if (entry.date === today) {
        currentPrice = entry.price;
        break;
      }
      if (new Date(entry.date) > new Date(today)) {
        break;
      }
    }

    // Construct the price object based on the current date
    let price;
    if (upcomingPrices.length > 0 && new Date(upcomingPrices[0].date) >= new Date(today)) {
      price = currentPrice;
    } else {
      price = originalPrice;
    }

    const rulesArray = JSON.parse(property.rules || "[]");

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
        attributes: ["id", "pro_pic", "name", "email", "mobile","createdAt"],
      });
    }

    const travelerReviews = await TravelerHostReview.findAll({
      where: {
        host_id: property.add_user_id,
        property_id: pro_id,
      },
      include: [
        {
          model: User,
          as: "traveler",
          attributes: ["name"],
        },
      ],
      attributes: ["rating", "review", "createdAt"],
    });

    const travelerReview = await TravelerHostReview.findAll({
      where: { host_id: property.add_user_id, property_id: pro_id },
      attributes: ["rating", "review", "createdAt"],
    });

    const totalRatings = travelerReview.length;
    const avgRating = totalRatings > 0
      ? (travelerReviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings).toFixed(2)
      : 0;

    const reviewsArray = travelerReviews.map((review) => ({
      traveler_name: review.traveler.name,
      posting_on: review.createdAt,
      rating: review.rating,
      review: review.review,
    }));

    const hostCreationMonths = ownerDetails
    ? Math.floor(
        (new Date().getFullYear() - new Date(ownerDetails.createdAt).getFullYear()) * 12 +
        (new Date().getMonth() - new Date(ownerDetails.createdAt).getMonth())
      )
    : null;
  

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

    // Fetch extra images and video from property table
    const extraImages = property.extra_images
      ? JSON.parse(property.extra_images)
      : [];
    // const video = property.video ? { url: property.video } : null;
  const videoUrl = property.video ? JSON.parse(property.video)[0] : null;
console.log("Video URL:", videoUrl);

    const gallery = {
      extra_images: extraImages,
      video: videoUrl,
    };
    

    const response = {
      propetydetails: {
        id: property.id,
        title: property.title,
        rate: rate,
        city: property.city,
        image: [{ image: propertyImage, is_panorama: panoramaStatus }],
        property_type: property.ptype,
        property_title: category?.title,
        // price: {
        //   originalPrice,
        //   currentPrice,
        //   upcomingPrices: upcomingPricesArray,
        // },
        price:price,
        extra_guest_charges:property.extra_guest_charges,
        buyorrent: property.pbuysell,
        address: property.address,
        beds: property.beds,
        bathroom: property.bathroom,
        standard_rules: standardRules,
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
              // host_reviews: reviewsArray,
              total_reviews: totalRatings,
              average_ratings:avgRating,
              since_months:hostCreationMonths
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

const getAllHostAddedProperties = async (req, res) => {
  const uid = req.user?.id || null;

  try {
    const today = new Date().toISOString().split("T")[0];

    // Fetch properties along with associated PriceCalendar and Booking entries
    const properties = await Property.findAll({
      where: { status: 1, ...(uid ? { add_user_id: uid } : {}) },
      include: [
        {
          model: PriceCalendar,
          as: "priceCalendars",
          attributes: ["date", "note", "prop_id", "price"],
        },
        {
          model: TblBook,
          as: "properties", // Use the correct alias
          attributes: ["check_in", "check_out", "uid", "book_status"],
          where: {
            check_in: { [Op.gte]: today }, // Only include bookings starting from today
          },
          required: false, // Allow properties without bookings to be included
          include: [
            {
              model: User,
              as: "User",
              attributes: ["name", "email", "mobile", "ccode"], // Fetch user details
            },
          ],
        },
      ],
    });

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Properties not found!",
      });
    }

    let ownerDetails = null;
    if (uid) {
      ownerDetails = await User.findOne({
        where: { id: uid },
        attributes: ["id", "pro_pic", "name", "email", "mobile"],
      });

      if (!ownerDetails) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "Owner not found!",
        });
      }
    }

    const propertiesWithUpdatedPrices = properties.map((property) => {
      const originalPrice = property.price;
      let upcomingPrices = [];

      if (property.priceCalendars) {
        const futureEntries = property.priceCalendars.filter(
          (calendar) => calendar.date > today
        );
        const todayEntry = property.priceCalendars.find(
          (calendar) => calendar.date === today
        );

        if (todayEntry) {
          upcomingPrices.push({
            date: todayEntry.date,
            price: todayEntry.price,
            note: todayEntry.note,
          });
        }

        upcomingPrices = [
          ...upcomingPrices,
          ...futureEntries.map((entry) => ({
            date: entry.date,
            price: entry.price,
            note: entry.note,
          })),
        ];
      }

      if (typeof property.rules === "string") {
        try {
          const parsedRules = JSON.parse(property.rules);
          property.rules = Array.isArray(parsedRules)
            ? parsedRules.join(", ")
            : property.rules
                .split(",")
                .map((rule) => rule.trim())
                .join(", ");
        } catch (error) {
          console.error("Error parsing rules:", error);
        }
      } else if (Array.isArray(property.rules)) {
        property.rules = property.rules.join(", ");
      }

      // Fetch booking details, but only if the booking status is Booked or Confirmed
      const bookingDetails = property.properties
        .filter((booking) =>
          ["Booked", "Confirmed"].includes(booking.book_status)
        )
        .map((booking) => ({
          book_status: booking.book_status,
          check_in: booking.check_in,
          check_out: booking.check_out,
          user: {
            name: booking.User.name,
            email: booking.User.email,
            mobile: booking.User.mobile,
            ccode: booking.User.ccode,
          },
        }));

      // Determine if property is available for booking
      const isAvailableForBooking =
        property.properties.some((booking) =>
          ["Completed", "Cancelled"].includes(booking.book_status)
        ) || bookingDetails.length === 0;

      return {
        id: property.id,
        title: property.title,
        image: property.image,
        city: property.city,
        price: originalPrice,
        upcomingPrices,
        address: property.address,
        rules: property.rules,
        beds: property.beds,
        bathroom: property.bathroom,
        sqrft: property.sqrft,
        description: property.description,
        bookingDetails,
        status: isAvailableForBooking ? "Available" : "Not Available",
      };
    });

    res.status(200).json({
      properties: propertiesWithUpdatedPrices,
      ...(ownerDetails
        ? {
            owner: {
              id: ownerDetails.id,
              name: ownerDetails.name,
              email: ownerDetails.email,
              phone: ownerDetails.mobile,
            },
          }
        : {}),
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Properties fetched successfully!",
    });
  } catch (error) {
    console.error("Error in getAllHostAddedProperties:", error);
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

const getAllProperties = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in ISO format

    // Fetch all properties with associated PriceCalendar entries
    const properties = await Property.findAll({
      where: { status: 1 }, // Optional condition to filter properties by status
      include: {
        model: PriceCalendar,
        as: "priceCalendars",
        attributes: ["date", "note", "prop_id", "price"],
      },
    });

    if (!properties || properties.length === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Properties not found!",
      });
    }

    const propertiesWithDetails = await Promise.all(
      properties.map(async (property) => {
        // Define the original price from the property table
        const originalPrice = property.price;

        // List for upcoming prices
        let upcomingPrices = [];

        // Check if PriceCalendar entry exists for today's date and future dates
        if (property.priceCalendars) {
          const futureEntries = property.priceCalendars.filter(
            (calendar) => calendar.date > today // Only future prices
          );
          const todayEntry = property.priceCalendars.find(
            (calendar) => calendar.date === today
          );

          // If today's price exists, include it in upcomingPrices
          if (todayEntry) {
            upcomingPrices.push({
              date: todayEntry.date,
              price: todayEntry.price,
              note: todayEntry.note,
            });
          }

          // Store price and note for future price changes
          upcomingPrices = [
            ...upcomingPrices,
            ...futureEntries.map((entry) => ({
              date: entry.date,
              price: entry.price,
              note: entry.note,
            })),
          ];
        }

        // Fetch owner details based on `add_user_id` (if exists)
        let ownerDetails = null;
        if (property.add_user_id) {
          const owner = await User.findOne({
            where: { id: property.add_user_id },
            attributes: ["id", "pro_pic", "name", "email", "mobile"],
          });
          if (owner) {
            ownerDetails = {
              id: owner.id,
              name: owner.name,
              email: owner.email,
              phone: owner.mobile,
            };
          }
        }

        // Process rules (parse and join as a string)
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

        return {
          id: property.id,
          title: property.title,
          image: property.image,
          city: property.city,
          price: originalPrice, // Display the original price from the Property table
          upcomingPrices, // Including today's price and future entries
          address: property.address,
          rules: property.rules,
          beds: property.beds,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          description: property.description,
          owner: ownerDetails, // Include owner details or null
        };
      })
    );

    res.status(200).json({
      properties: propertiesWithDetails,
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

const getPropertyCategories = async (req, res) => {
  try {
    const categories = await TblCategory.findAll({ where: {status:1} });
    if(!categories){
      res.status(400).json({message:"Categories not found"})
    }
    res.status(201).json({message:"Categories fetched Successfully", categories})
  } catch (error) {
    console.error("Error in getPropertyCategories:", error);
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
  getAllHostAddedProperties,
  getSortedProperties,
  getSortedPropertiestitle,
  searchPropertyByLocationAndDate,
  searchProperties,
  deleteUserProperty,
  nearByProperties,
  getAllProperties,
  getPropertyCategories
};
