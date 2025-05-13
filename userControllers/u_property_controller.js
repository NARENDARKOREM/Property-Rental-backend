const { Op, where, literal } = require("sequelize");
const {
  TblCategory,
  TblExtra,
  User,
  PriceCalendar,
  TblCountry,
} = require("../models");
const moment = require("moment");
const Property = require("../models/Property");
const TblBook = require("../models/TblBook");
const TblFacility = require("../models/TblFacility");
const TblFav = require("../models/TblFav");
const TblGallery = require("../models/TblGallery");
const TblEnquiry = require("../models/TblEnquiry");
const Setting = require("../models/Setting");
const TblExtraImage = require("../models/TableExtraImages");
const uploadToS3 = require("../config/fileUpload.aws");
const TravelerHostReview = require("../models/TravelerHostReview");
const PropertyBlock = require("../models/PropertyBlock");
const PersonRecord = require("../models/PersonRecord");
const TblCity = require("../models/TblCity");


const addProperty = async (req, res) => {
  const {
    title,
    price,   
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
    extra_guest_charges,
    video_url,
    is_draft=false
  } = req.body;

  const files = req.files;
  const add_user_id = req.user.id;

  if (!add_user_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User ID not provided",
    });
  }

  if (!is_draft) {
    if (
      !is_sell ||
      !country_id ||
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
      !latitude ||
      !mobile ||
      !price ||
      !files ||
      !files.main_image
    ) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "All fields and at least the main image are required!",
      });
    }
  }

  // Required field check
  if (!add_user_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User ID not provided",
    });
  }

  try {
    // Validate country exists
    if (country_id && !is_draft) {
      const countryRecord = await TblCountry.findByPk(country_id);
      if (!countryRecord) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "Country not found!",
        });
      }
    }

    // Parse standard_rules (ensure it's a JSON object)
    let parsedStandardRules;
    try {
      parsedStandardRules =
        typeof standard_rules === "object"
          ? standard_rules
          : JSON.parse(standard_rules);
    } catch (err) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid JSON format in standard_rules",
      });
    }
    if (typeof parsedStandardRules !== "object") {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "standard_rules must be a valid JSON object",
      });
    }

    // Parse rules as a JSON array
    let parsedRules;
    try {
      if (typeof rules === "object") {
        parsedRules = rules;
      } else if (typeof rules === "string") {
        const trimmed = rules.trim();
        if (trimmed.startsWith("[")) {
          parsedRules = JSON.parse(trimmed);
        } else {
          // Assume it's a comma-separated list.
          parsedRules = trimmed.split(",").map((item) => item.trim());
        }
      }
    } catch (err) {
      return res.status(400).json({
        error: "Invalid JSON format in rules",
      });
    }

    // Convert facility to an array of numeric IDs.
    // const facilityIds = Array.isArray(facility)
    //   ? facility.map(Number)
    //   : facility.split(",").map((id) => Number(id.trim()));

    let facilityIds = [];
    if (facility) {
      facilityIds = Array.isArray(facility)
        ? facility.map(Number)
        : facility.split(",").map((id) => Number(id.trim()));
    }

    // File validations
    const allowedImageTypes = ["jpeg", "png", "jpg"];
    const allowedVideoTypes = ["mp4"];
    const maxSize = 102400; // 100KB in bytes
    const getFileExtension = (filename) =>
      filename.split(".").pop().toLowerCase();

    // Validate main image
    const mainImage = files.main_image[0];
    const mainImageExt = getFileExtension(mainImage.originalname);
    if (!allowedImageTypes.includes(mainImageExt)) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg:
          "Invalid main image format! Only .jpg, .png, and .jpeg are allowed.",
      });
    }
    if (mainImage.size > maxSize) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg:
          "Main image file is too large! Please upload a file of 100KB or below.",
      });
    }

    // Process extra images and videos
    const extraImages = [];
    const videos = [];
    if (files.extra_files) {
      for (const file of files.extra_files) {
        const ext = getFileExtension(file.originalname);
        if (allowedImageTypes.includes(ext)) {
          if (file.size > maxSize) {
            return res.status(400).json({
              ResponseCode: "400",
              Result: "false",
              ResponseMsg: `Extra image ${file.originalname} is too large! Each image must be 100KB or below.`,
            });
          }
          extraImages.push(file);
        } else if (allowedVideoTypes.includes(ext)) {
          videos.push(file);
        } else {
          return res.status(400).json({
            ResponseCode: "400",
            Result: "false",
            ResponseMsg: `Invalid file format for ${file.originalname}. Allowed formats: .jpg, .png for images and .mp4 for videos.`,
          });
        }
      }
    }

    // Upload files to S3
    const mainImageUrl = await uploadToS3([mainImage], "property-main-image");
    const extraImageUrls = extraImages.length
      ? await uploadToS3(extraImages, "property-extra-images")
      : [];
    const finalExtraImages = Array.isArray(extraImageUrls)
      ? extraImageUrls
      : [extraImageUrls];
    // For videos, store as JSON string (since the column expects a string)
    const videoUrls = videos.length
      ? await uploadToS3(videos, "property-videos")
      : [];

    let videoUrlS3 = null;
    if (files.video_url && files.video_url.length > 0) {
      const videoFile = files.video_url[0];
      const ext = getFileExtension(videoFile.originalname);
      if (!allowedVideoTypes.includes(ext)) {
        return res.status(400).json({
          ResponseCode: "400",
          Result: "false",
          ResponseMsg:
            "Invalid video file format for video_url! Only mp4 is allowed.",
        });
      }
      // Optionally set a different size limit for video_url files.
      videoUrlS3 = await uploadToS3([videoFile], "property-videos");
      if (Array.isArray(videoUrlS3)) {
        videoUrlS3 = videoUrlS3[0];
      }
    }

    console.log("Extra Images", extraImageUrls);

    // --- Determine City ID ---
    let cityId;
    if (typeof city === "object" && city !== null && city.value) {
      cityId = city.value;
    } else if (typeof city === "string") {
      if (city.trim().startsWith("{")) {
        try {
          const parsedCity = JSON.parse(city);
          if (parsedCity && parsedCity.value) {
            cityId = parsedCity.value;
          }
        } catch (err) {
          console.error("Error parsing city JSON:", err.message);
        }
      } else if (!isNaN(Number(city))) {
        cityId = Number(city);
      } else {
        const cityRecord = await TblCity.findOne({
          where: { title: city },
          attributes: ["title"],
        });
        if (cityRecord) {
          cityId = cityRecord.id;
        }
      }
    }
    if (!cityId && !is_draft) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Valid city ID is required!",
      });
    }
  
    // --- End Determine City ID ---

    // Create new property. Listing_date is stored as provided (assumed YYYY-MM-DD).
    const newProperty = await Property.create({
      title,
      image: mainImageUrl,
      extra_images: finalExtraImages,
      video: JSON.stringify(videoUrls), // Save the video URLs as a JSON string
      video_url: videoUrlS3,
      price,
      status:0,
      address,
      facility: facilityIds, // store as an array (if your model supports JSON)
      description,
      beds,
      bathroom,
      sqrft,
      rate,
      rules: parsedRules, // store as JSON array
      standard_rules: parsedStandardRules, // store as JSON object
      ptype,
      latitude,
      longtitude,
      mobile,
      city: cityId,
      listing_date, // store as date (e.g., "2025-03-08")
      add_user_id,
      country_id,
      is_sell,
      adults,
      children,
      infants,
      pets,
      setting_id,
      extra_guest_charges,
      video_url,
      is_draft:is_draft,
    });

    res.status(201).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: is_draft ? "Draft property saved successfully!" : "Property added successfully!",
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
      
      title,
      address,
      description,
      city, // Expected as an object { value, label } or JSON string
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
      extra_guest_charges,
      video_url, // Optional fallback video URL from the body
      is_draft=false,
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

    if (country_id && !is_draft) {
      const countryRecord = await TblCountry.findByPk(country_id);
      if (!countryRecord) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "Country not found!",
        });
      }
    }

    // Fetch the property instance that the user wants to edit
    const property = await Property.findOne({
      where: { id: prop_id, add_user_id: user_id },
    });
    if (!property) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg:
          "Property not found or you are not authorized to edit this property",
      });
    }

    const files = req.files; // Uploaded files from multipart/form-data

    // Parse standard_rules ensuring it's a JSON object
    let parsedStandardRules;
    try {
      parsedStandardRules =
        typeof standard_rules === "object"
          ? standard_rules
          : JSON.parse(standard_rules);
    } catch (err) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid JSON format in standard_rules",
      });
    }
    if (typeof parsedStandardRules !== "object") {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "standard_rules must be a valid JSON object",
      });
    }

    // Parse rules as a JSON array
    let parsedRules;
    try {
      if (typeof rules === "object") {
        parsedRules = rules;
      } else if (typeof rules === "string") {
        const trimmed = rules.trim();
        if (trimmed.startsWith("[")) {
          parsedRules = JSON.parse(trimmed);
        } else {
          // Assume it's a comma-separated list.
          parsedRules = trimmed.split(",").map((item) => item.trim());
        }
      }
    } catch (err) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid JSON format in rules",
      });
    }

    // Convert facility to an array of numeric IDs.
    const facilityIds = Array.isArray(facility)
      ? facility.map(Number)
      : facility.split(",").map((id) => Number(id.trim()));

    // File validations
    const allowedImageTypes = ["jpeg", "png", "jpg"];
    const allowedVideoTypes = ["mp4"];
    const maxSize = 102400; // 100KB in bytes
    const getFileExtension = (filename) =>
      filename.split(".").pop().toLowerCase();

    // Validate main image: main_image is required during update.
    if (!files || !files.main_image || files.main_image.length === 0) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Main image is required.",
      });
    }
    const mainImage = files.main_image[0];
    const mainImageExt = getFileExtension(mainImage.originalname);
    if (!allowedImageTypes.includes(mainImageExt)) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg:
          "Invalid main image format! Only .jpg, .png, and .jpeg are allowed.",
      });
    }
    if (mainImage.size > maxSize) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg:
          "Main image file is too large! Please upload a file of 100KB or below.",
      });
    }

    // Process extra images and videos from extra_files
    const extraImages = [];
    const videos = [];
    if (files.extra_files) {
      for (const file of files.extra_files) {
        const ext = getFileExtension(file.originalname);
        if (allowedImageTypes.includes(ext)) {
          if (file.size > maxSize) {
            return res.status(400).json({
              ResponseCode: "400",
              Result: "false",
              ResponseMsg: `Extra image ${file.originalname} is too large! Each image must be 100KB or below.`,
            });
          }
          extraImages.push(file);
        } else if (allowedVideoTypes.includes(ext)) {
          videos.push(file);
        } else {
          return res.status(400).json({
            ResponseCode: "400",
            Result: "false",
            ResponseMsg: `Invalid file format for ${file.originalname}. Allowed formats: .jpg, .png for images and .mp4 for videos.`,
          });
        }
      }
    }

    // Process video_url file if provided (separate from extra_files)
    let videoUrlS3 = null;
    if (files.video_url && files.video_url.length > 0) {
      const videoFile = files.video_url[0];
      const ext = getFileExtension(videoFile.originalname);
      if (!allowedVideoTypes.includes(ext)) {
        return res.status(400).json({
          ResponseCode: "400",
          Result: "false",
          ResponseMsg:
            "Invalid video file format for video_url! Only mp4 is allowed.",
        });
      }
      videoUrlS3 = await uploadToS3([videoFile], "property-videos");
      if (Array.isArray(videoUrlS3)) {
        videoUrlS3 = videoUrlS3[0];
      }
    }

    // Determine City ID using the "city" field from the request.
    let cityId;
    if (typeof city === "object" && city !== null && city.value) {
      cityId = city.value;
    } else if (typeof city === "string") {
      if (city.trim().startsWith("{")) {
        try {
          const parsedCity = JSON.parse(city);
          if (parsedCity && parsedCity.value) {
            cityId = parsedCity.value;
          }
        } catch (err) {
          console.error("Error parsing city JSON:", err.message);
        }
      } else if (!isNaN(Number(city))) {
        cityId = Number(city);
      } else {
        // Try to look up the city by title
        const cityRecord = await TblCity.findOne({
          where: { title: city },
          attributes: ["title"],
        });
        if (cityRecord) {
          cityId = cityRecord.id;
        }
      }
    }
    if (!cityId && !is_draft) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Valid city ID is required!",
      });
    }

    // Upload main image and extra files to S3
    const mainImageUrl = await uploadToS3([mainImage], "property-main-image");
    const extraImageUrls = extraImages.length
      ? await uploadToS3(extraImages, "property-extra-images")
      : [];
    const finalExtraImages = Array.isArray(extraImageUrls)
      ? extraImageUrls
      : [extraImageUrls];
    const videoUrls = videos.length
      ? await uploadToS3(videos, "property-videos")
      : [];

    // Update the property with the new details
    await property.update({
      status:property.status,
      title,
      address,
      description,
      facility: facilityIds, // store as an array of IDs
      ptype,
      beds,
      bathroom,
      sqrft,
      rate,
      rules: parsedRules,
      standard_rules: parsedStandardRules,
      latitude,
      longtitude,
      mobile,
      listing_date,
      price,
      country_id,
      is_sell,
      adults,
      children,
      infants,
      pets,
      setting_id,
      extra_guest_charges,
      // Use video_url from req.body if provided; otherwise, use the newly uploaded video URL.
      video_url: video_url || videoUrlS3,
      image: mainImageUrl,
      extra_images: finalExtraImages,
      video: JSON.stringify(videoUrls),
      city: cityId,
      status:property.status,
      is_draft:is_draft,
    });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: is_draft ? "Draft Property Updated Successfully" : "Property Updated Successfully",
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
    console.log("Request User:", req.user);
    const uid = req.user?.id || null;
    if (!uid) {
      res.status(401).json({ message: "Unauthorized: User not found!" });
    }
    console.log("Fetching properties for user ID:", uid);
    // Include TblCity to get city details
    const properties = await Property.findAll({
      where: {
        add_user_id: uid,
        add_user_id: { [Op.ne]: null },
        [Op.or]: [{ status: 1 }, { status: 0, is_draft: true }],
      },
      include: [
        { model: TblCategory, as: "category", attributes: ["title"] },
        // { model: TblFacility, as: "facilities", attributes: ["title"] },
        { model: TblCountry, as: "country", attributes: ["title"] },
        { model: TblCity, as: "cities", attributes: ["title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Helper function to recursively flatten an array.
    const flattenArray = (arr) =>
      arr.reduce(
        (acc, val) =>
          Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val),
        []
      );

    const propertyList = await Promise.all(
      properties.map(async (property) => {
        // Process facility field: if facility is a string, convert to an array; if already an array, use it.
        let facilityIds = [];
        if (typeof property.facility === "string") {
          facilityIds = property.facility
            .split(",")
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isInteger(id));
        } else if (Array.isArray(property.facility)) {
          facilityIds = property.facility;
        }

        // Fetch facility details if needed (you might already have these in the included "facilities" field)
        const facilities = facilityIds.length
          ? await TblFacility.findAll({
              where: { id: { [Op.in]: facilityIds } },
              attributes: ["img", "title"],
            })
          : [];

        // Process and flatten the rules field.
        let rulesArray;
        if (Array.isArray(property.rules)) {
          rulesArray = flattenArray(property.rules);
        } else if (typeof property.rules === "string") {
          try {
            const parsed = JSON.parse(property.rules);
            rulesArray = Array.isArray(parsed)
              ? flattenArray(parsed)
              : [parsed];
          } catch (error) {
            try {
              rulesArray = property.rules.split(",").map((rule) => rule.trim());
            } catch (e) {
              rulesArray = [];
            }
          }
        } else {
          rulesArray = [];
        }
        rulesArray = flattenArray(rulesArray);

        // Convert property instance to plain object and remove nested country and cities.
        const propertyObj = property.toJSON();
        const { country, cities, ...rest } = propertyObj;

        return {
          ...rest,
          // Add flat fields
          country_name: country ? country.title : "",
          city: cities ? cities.title : propertyObj.city,
          facilities, // facility details (if needed)
          rules: rulesArray,
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
      useriiid: req.user,
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

const getPropertyTypes = async (req, res) => {
  const { ptype } = req.body;

  try {
    // Validate input - ensure ptype is provided (even if 0)
    if (ptype === undefined || ptype === null) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "ptype is required!",
      });
    }

    // Build the where condition.
    // If ptype is 0, don't filter by ptype; otherwise, add the ptype filter.
    const whereCondition = { status: 1 };
    if (Number(ptype) !== 0) {
      whereCondition.ptype = ptype;
    }

    // Fetch property types
    const typeList = await Property.findAll({
      where: whereCondition,
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

    // Check if any types are found
    if (!typeList || typeList.length === 0) {
      return res.status(404).json({
        typelist: [],
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Property Type Not Found!",
      });
    }

    // Helper function to recursively flatten an array.
    const flattenArray = (arr) =>
      arr.reduce(
        (acc, val) =>
          Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val),
        []
      );

    const formattedProperties = await Promise.all(
      typeList.map(async (property) => {
        // Process facility field.
        let facilityIds = [];
        if (typeof property.facility === "string") {
          facilityIds = property.facility
            .split(",")
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isInteger(id));
        } else if (Array.isArray(property.facility)) {
          facilityIds = property.facility;
        }

        const facilities = facilityIds.length
          ? await TblFacility.findAll({
              where: { id: facilityIds },
              attributes: ["id", "title"],
            })
          : [];

        // Process and flatten the rules field.
        let rulesArray = [];
        if (property.rules) {
          if (typeof property.rules === "string") {
            try {
              const parsed = JSON.parse(property.rules);
              rulesArray = Array.isArray(parsed)
                ? flattenArray(parsed)
                : [parsed];
            } catch (error) {
              try {
                rulesArray = property.rules
                  .split(",")
                  .map((rule) => rule.trim());
              } catch (e) {
                rulesArray = [];
              }
            }
          } else if (Array.isArray(property.rules)) {
            rulesArray = flattenArray(property.rules);
          }
        }

        const cityRecord = await TblCity.findByPk(property.city, {
          attributes: ["title"],
        });
        const cityName = cityRecord ? cityRecord.title : property.city;

        return {
          ...property.toJSON(),
          facilities,
          rules: rulesArray,
          city: cityName,
        };
      })
    );

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
      include: [
        {
          model: PriceCalendar,
          as: "priceCalendars",
          attributes: ["date", "note", "prop_id", "price"],
        },
      ],
    });

    if (!property) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Property not found!",
      });
    }

    const standardRules = (() => {
      try {
        return property.standard_rules
          ? JSON.parse(property.standard_rules)
          : null;
      } catch (err) {
        console.error(
          "Invalid JSON in standard_rules:",
          property.standard_rules
        );
        return property.standard_rules;
      }
    })();

    const today = new Date().toISOString().split("T")[0];
    const originalPrice = property.price;
    console.log("Original Price", originalPrice);

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
    if (
      upcomingPrices.length > 0 &&
      new Date(upcomingPrices[0].date) >= new Date(today)
    ) {
      price = currentPrice;
    } else {
      price = originalPrice;
    }
    console.log("originalPrice", originalPrice);
    console.log("upcomingPrice", upcomingPrices);

    const flattenArray = (arr) =>
      arr.reduce(
        (acc, val) =>
          Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val),
        []
      );

    let rulesArray;
    if (Array.isArray(property.rules)) {
      rulesArray = property.rules;
    } else if (typeof property.rules === "string") {
      try {
        const parsed = JSON.parse(property.rules);
        rulesArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        try {
          rulesArray = property.rules.split(",").map((rule) => rule.trim());
        } catch (e) {
          rulesArray = [];
        }
      }
    } else {
      rulesArray = [];
    }
    rulesArray = flattenArray(rulesArray);

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
        attributes: [
          "id",
          "pro_pic",
          "name",
          "email",
          "languages",
          "mobile",
          "createdAt",
        ],
      });
    }

    if (ownerDetails && ownerDetails.languages) {
      if (typeof ownerDetails.languages === "string") {
        try {
          ownerDetails.languages = JSON.parse(ownerDetails.languages);
          if (!Array.isArray(ownerDetails.languages)) {
            ownerDetails.languages = [ownerDetails.languages];
          }
        } catch (error) {
          ownerDetails.languages = ownerDetails.languages
            .split(",")
            .map((lang) => lang.trim());
        }
      }
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
    const avgRating =
      totalRatings > 0
        ? (
            travelerReviews.reduce((sum, review) => sum + review.rating, 0) /
            totalRatings
          ).toFixed(2)
        : 0;

    const reviewsArray = travelerReviews.map((review) => ({
      traveler_name: review.traveler.name,
      posting_on: review.createdAt,
      rating: review.rating,
      review: review.review,
    }));

    const hostCreationMonths = ownerDetails
      ? Math.floor(
          (new Date().getFullYear() -
            new Date(ownerDetails.createdAt).getFullYear()) *
            12 +
            (new Date().getMonth() -
              new Date(ownerDetails.createdAt).getMonth())
        )
      : null;

    let facilityIds = [];
    if (typeof property.facility === "string") {
      facilityIds = property.facility.split(",").map((id) => id.trim());
    } else if (Array.isArray(property.facility)) {
      facilityIds = property.facility;
    }

    const facilities = await TblFacility.findAll({
      where: {
        id: { [Op.in]: facilityIds },
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
    const extraImages = (() => {
      if (!property.extra_images) {
        return [];
      } else if (typeof property.extra_images === "string") {
        const trimmed = property.extra_images.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          try {
            let parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (err) {
            console.error("Error parsing extra_images JSON:", err.message);
            return [property.extra_images];
          }
        } else {
          return [property.extra_images];
        }
      } else if (Array.isArray(property.extra_images)) {
        return property.extra_images;
      }
      return [];
    })();

    const videoUrl = property.video
      ? typeof property.video === "string"
        ? property.video.trim().startsWith("[") ||
          property.video.trim().startsWith("{")
          ? JSON.parse(property.video)
          : property.video
        : property.video
      : null;

    const youtubeUrl = property.video_url
      ? typeof property.video_url === "string"
        ? property.video_url.trim().startsWith("[") ||
          property.video_url.trim().startsWith("{")
          ? JSON.parse(property.video_url)
          : property.video_url
        : property.video_url
      : null;

    const gallery = {
      extra_images: extraImages,
      video: videoUrl,
      video_url: youtubeUrl,
    };

    const cityRecord = await TblCity.findByPk(property.city, {
      attributes: ["title"],
    });
    const cityName = cityRecord ? cityRecord.title : property.city;

    const propertyObj = {
      ...property.toJSON(),
      city: cityName,
      rules: rulesArray,
    };

    const response = {
      propetydetails: {
        id: property.id,
        title: property.title,
        rate: rate,
        city: propertyObj.city,
        image: [{ image: propertyImage, is_panorama: panoramaStatus }],
        property_type: property.ptype,
        property_title: category?.title,
        price: {
          originalPrice,
          currentPrice,
          upcomingPrices: upcomingPrices,
        },
        price: originalPrice,
        upcomingPrices,
        extra_guest_charges: property.extra_guest_charges,
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
              languages: ownerDetails.languages,
              // host_reviews: reviewsArray,
              total_reviews: totalRatings,
              average_ratings: avgRating,
              since_months: hostCreationMonths,
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

    // Fetch properties with related PriceCalendar, Booking, and Block data.
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
          as: "properties",
          attributes: ["check_in", "check_out", "uid", "book_status"],
          where: { check_in: { [Op.gte]: today } },
          required: false,
          include: [
            {
              model: User,
              as: "travler_details",
              attributes: ["name", "email", "mobile", "ccode"],
            },
          ],
        },
        {
          model: PropertyBlock,
          as: "blockedDates",
          attributes: ["block_start", "block_end", "reason"],
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

    // Helper function to recursively flatten an array.
    const flattenArray = (arr) =>
      arr.reduce(
        (acc, val) =>
          Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val),
        []
      );

    const propertiesWithUpdatedPrices = await Promise.all(
      properties.map(async (property) => {
        const originalPrice = property.price;
        let upcomingPrices = [];

        // if (property.priceCalendars) {
        //   const futureEntries = property.priceCalendars.filter(
        //     (calendar) => calendar.date >= new Date(today)
        //   );
        //   const todayEntry = property.priceCalendars.find(
        //     (calendar) => calendar.date === today
        //   );
        if (property.priceCalendars) {
          const futureEntries = property.priceCalendars.filter(
            (calendar) =>
              new Date(calendar.date).toISOString().split("T")[0] >= today
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
              date: new Date(entry.date).toISOString().split("T")[0],
              price: entry.price,
              note: entry.note,
            })),
          ];
        }
        // console.log("Fetched Price Calendars: ", property.priceCalendars);

        // Process and flatten the rules field.
        let rulesArray;
        if (Array.isArray(property.rules)) {
          rulesArray = flattenArray(property.rules);
        } else if (typeof property.rules === "string") {
          try {
            const parsed = JSON.parse(property.rules);
            rulesArray = Array.isArray(parsed)
              ? flattenArray(parsed)
              : [parsed];
          } catch (error) {
            try {
              rulesArray = property.rules.split(",").map((rule) => rule.trim());
            } catch (e) {
              rulesArray = [];
            }
          }
        } else {
          rulesArray = [];
        }

        // Calculate rate based on completed bookings.
        const completedBookings = await TblBook.findAll({
          where: {
            prop_id: property.id,
            book_status: "Completed",
            total_rate: { [Op.ne]: 0 },
          },
        });
        const calculatedRate =
          completedBookings.length > 0
            ? (
                completedBookings.reduce(
                  (sum, booking) => sum + booking.total_rate,
                  0
                ) / completedBookings.length
              ).toFixed(0)
            : property.rate;

        // Process booking details.
        let bookingDetails = [];
        if (property.properties.length > 0) {
          bookingDetails = property.properties.map((booking) => ({
            book_status: booking.book_status,
            check_in: new Date(booking.check_in).toISOString().split("T")[0],
            check_out: new Date(booking.check_out).toISOString().split("T")[0],
            user: {
              name: booking.travler_details?.name,
              email: booking.travler_details?.email,
              mobile: booking.travler_details?.mobile,
              ccode: booking.travler_details?.ccode,
            },
          }));
        }
        let blockedDates = [];
        if (property.blockedDates && property.blockedDates.length > 0) {
          blockedDates = property.blockedDates.map((block) => ({
            book_status: "Blocked",
            check_in: block.block_start,
            check_out: block.block_end,
            reason: block.reason,
          }));
        }

        // Process facility field: if it's a string, convert to an array.
        let facilityIds = [];
        if (typeof property.facility === "string") {
          facilityIds = property.facility.split(",").map((id) => id.trim());
        } else if (Array.isArray(property.facility)) {
          facilityIds = property.facility;
        }
        const facilities = await TblFacility.findAll({
          where: { id: { [Op.in]: facilityIds } },
          attributes: ["img", "title"],
        });

        // Lookup city name by property.city (which is stored as an id)
        let cityName = property.city;
        try {
          const cityRecord = await TblCity.findByPk(property.city, {
            attributes: ["title"],
          });
          if (cityRecord) {
            cityName = cityRecord.title;
          }
        } catch (err) {
          console.error("Error fetching city:", err);
        }

        const isFavorite = await TblFav.count({
          where: { uid: uid, property_id: property.id },
        });

        const reviews = await TblBook.findAll({
          where: {
            prop_id: property.id,
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
          where: { prop_id: property.id, book_status: "Completed", is_rate: 1 },
        });

        const propertyImage = property.image;
        const panoramaStatus = property.is_panorama;

        // Process extra images and video.
        let extraImagesParsed = [];
        try {
          extraImagesParsed = property.extra_images
            ? JSON.parse(property.extra_images)
            : [];
        } catch (err) {
          extraImagesParsed = [];
        }
        let videoUrlParsed = null;
        try {
          videoUrlParsed = property.video ? JSON.parse(property.video) : null;
        } catch (err) {
          videoUrlParsed = null;
        }
        // console.log("Video URL:", videoUrlParsed);

        return {
          id: property.id,
          title: property.title,
          image: property.image,
          city: cityName, // return city name instead of id
          price: originalPrice,
          upcomingPrices,
          address: property.address,
          rules: rulesArray, // flat rules array
          beds: property.beds,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          description: property.description,
          bookingDetails: [...bookingDetails, ...blockedDates],
          status: bookingDetails.length === 0 ? "Available" : "Not Available",
          facilities,
          rate: calculatedRate,
        };
      })
    );

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

    // Validate sort parameter
    if (!sort || !["asc", "desc"].includes(sort.toLowerCase())) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid sort parameter. Use 'asc' or 'desc'.",
      });
    }

    let properties;
    if (id === 0) {
      // Fetch properties without filtering by property type (ptype)
      properties = await Property.findAll({
        where: { status: 1 },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["price", sort.toLowerCase()]],
      });
    } else {
      // Fetch properties filtered by property type (ptype)
      properties = await Property.findAll({
        where: { status: 1, ptype: id },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["price", sort.toLowerCase()]],
      });
    }

    if (!properties.length) {
      return res.status(200).json({
        typelist: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "No properties found",
      });
    }

    // Map through properties to enrich with additional details
    const formattedProperties = await Promise.all(
      properties.map(async (property) => {
        // Process facility field safely
        let facilityIds = [];
        if (typeof property.facility === "string") {
          facilityIds = property.facility
            .split(",")
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isInteger(id));
        } else if (Array.isArray(property.facility)) {
          facilityIds = property.facility;
        }

        // Fetch facility details using the facility IDs
        const facilities = facilityIds.length
          ? await TblFacility.findAll({
              where: { id: { [Op.in]: facilityIds } },
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

    let properties;
    if (id === 0) {
      // Fetch and sort properties based on title
      properties = await Property.findAll({
        where: { status: 1 },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["title", sort.toLowerCase()]],
      });
    } else {
      // Fetch and sort properties filtered by property type (ptype)
      properties = await Property.findAll({
        where: { status: 1, ptype: id },
        include: [
          { model: TblCategory, as: "category", attributes: ["title"] },
          { model: TblFacility, as: "facilities", attributes: ["title"] },
          { model: TblCountry, as: "country", attributes: ["title"] },
        ],
        order: [["title", sort.toLowerCase()]],
      });
    }

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
        // Process facility field safely based on its type
        let facilityIds = [];
        if (typeof property.facility === "string") {
          facilityIds = property.facility
            .split(",")
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isInteger(id));
        } else if (Array.isArray(property.facility)) {
          facilityIds = property.facility;
        }

        // Fetch facility details using the facility IDs
        const facilities = facilityIds.length
          ? await TblFacility.findAll({
              where: { id: { [Op.in]: facilityIds } },
              attributes: ["id", "title"],
            })
          : [];

        return {
          ...property.toJSON(),
          facilities, // attach facilities details instead of raw facility IDs
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

    // First, find cities whose title matches the location (e.g., "Hyderabad")
    const matchingCities = await TblCity.findAll({
      where: { title: { [Op.like]: `%${location}%` } },
      attributes: ["id", "title"],
    });

    if (!matchingCities.length) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No matching cities found.",
      });
    }

    // Extract city IDs from the matching cities
    const cityIds = matchingCities.map((city) => city.id);

    // Build the initial property filter using the city IDs
    let propertyFilter = { status: 1, city: { [Op.in]: cityIds } };

    // Fetch properties with a join on TblCity to get the city title
    let properties = await Property.findAll({
      where: propertyFilter,
      include: [
        {
          model: TblCity,
          as: "cities", // Ensure that your Property model has: Property.belongsTo(TblCity, { foreignKey: 'city', as: 'cities' })
          attributes: ["title"],
        },
      ],
    });

    // (Your additional filtering by check_in/check_out and guest counts goes here.)

    // Get favorite property IDs if needed
    let favoriteProperties = [];
    if (uid) {
      favoriteProperties = await TblFav.findAll({
        where: { uid: uid },
        attributes: ["property_id"],
      }).then((favs) => favs.map((fav) => fav.property_id));
    }

    if (!properties.length) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No properties found for the given criteria.",
      });
    }

    // Map properties to return the city title from the join
    const searchedProperties = properties.map((property) => ({
      id: property.id,
      title: property.title,
      rate: property.rate,
      adults: property.adults,
      children: property.children,
      infants: property.infants,
      pets: property.pets,
      // Use the joined city title if available; fallback to the raw city value.
      city: property.cities ? property.cities.title : property.city,
      image: property.image,
      propertyType: property.ptype,
      price: property.price,
      favorite: favoriteProperties.includes(property.id) ? 1 : 0,
    }));

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
    return res.status(401).json({ message: "User not found!" });
  }
  console.log("User ID from token:", uid);

  try {
    const propertyId = req.params.propertyId;
    const forceDelete = req.query.forceDelete === "true";

    if (!propertyId) {
      return res.status(400).json({ message: "Property Id is required!" });
    }
    console.log(
      "Deleting property with ID:",
      propertyId,
      "Force delete:",
      forceDelete
    );

    const property = await Property.findOne({
      where: { id: propertyId, add_user_id: uid },
      paranoid: false,
    });

    if (!property) {
      return res.status(404).json({
        message: "Property not found or you don't have permission to delete!",
      });
    }

    const activeBookings = await TblBook.findOne({
      where: {
        prop_id: propertyId,
        book_status: { [Op.in]: ["Confirmed", "Booked", "Check_in"] },
      },
    });

    if (activeBookings) {
      return res.status(400).json({
        message:
          "Property cannot be deleted as it has active or pending bookings!",
      });
    }

    const bookings = await TblBook.findAll({
      where: { prop_id: propertyId },
      attributes: ["id"],
    });

    if (bookings.length > 0) {
      const bookIds = bookings.map((booking) => booking.id);
      await PersonRecord.destroy({ where: { book_id: bookIds } });
    }

    await TblBook.destroy({ where: { prop_id: propertyId } });
    await PropertyBlock.destroy({ where: { prop_id: propertyId } });
    await PriceCalendar.destroy({ where: { prop_id: propertyId } });
    await TblExtra.destroy({ where: { pid: propertyId } });
    await TblFav.destroy({ where: { property_id: propertyId } });
    await TblGallery.destroy({ where: { pid: propertyId } });

    const extraRecords = await TblExtra.findAll({ where: { pid: propertyId } });
    if (extraRecords.length > 0) {
      const extraIds = extraRecords.map((extra) => extra.id);
      await TblExtraImage.destroy({ where: { id: extraIds } });
    }

    await TravelerHostReview.destroy({ where: { property_id: propertyId } });

    // **Soft delete (default) or Force delete if requested**
    await Property.destroy({ where: { id: propertyId }, force: forceDelete });

    return res.status(200).json({
      message: forceDelete
        ? "Property deleted successfully!"
        : "Property deleted successfully!",
    });
  } catch (error) {
    console.error("Error Occurred While Deleting Property:", error);
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
    const categories = await TblCategory.findAll({ where: { status: 1 } });
    if (!categories) {
      res.status(400).json({ message: "Categories not found" });
    }
    res
      .status(201)
      .json({ message: "Categories fetched Successfully", categories });
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
  getPropertyCategories,
};
