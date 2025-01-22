const { Sequelize, Op, fn, col, literal} = require("sequelize");
const { Property, TblExtra, User } = require("../models");
const TblBook = require("../models/TblBook");
const sequelize = require("../db");

const dashboardData = async (req, res) => {
  try {
    const uid = req.user.id;
    const propertyId = req.query.propertyId;

    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    const userProperties = await Property.findAll({
      where: { add_user_id: uid },
      attributes: ["id"],
    });

    const userPropertyIds = userProperties.map((property) => property.id);

    if (userPropertyIds.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    const whereCondition = {
      add_user_id: uid,
      book_status: "Completed",
      p_method_id: { [Op.ne]: 2 },
      prop_id: propertyId || { [Op.in]: userPropertyIds },
    };

    const [
      totalPropertyCount,
      totalLocationCount,
      totalNightBookingCount,
      nightBookingCounts,
      totalReviewsArray,
      totalEarnings,
      propertyDetails
    ] = await Promise.all([
      Property.count({ where: { add_user_id: uid } }),
      Property.count({
        where: { add_user_id: uid },
        distinct: true,
        col: "city",
      }),
      TblBook.count({
        where: {
          add_user_id: uid,
          prop_id: { [Op.in]: userPropertyIds },
          book_status: "Completed",
        },
      }),
      TblBook.findAll({
        attributes: [
          [
            sequelize.fn("DATEDIFF", sequelize.col("check_out"), sequelize.col("check_in")),
            "night_count",
          ],
        ],
        where: {
          add_user_id: uid,
          prop_id: { [Op.in]: userPropertyIds },
          book_status: { [Op.in]: ["Completed", "Confirmed"] },
        },
      }),
      TblBook.findAll({
        where: {
          add_user_id: uid,
          prop_id: { [Op.in]: userPropertyIds },
          book_status: "Completed",
          total_rate: { [Op.ne]: null },
        },
        attributes: ["total_rate"],
      }),
      TblBook.sum("total", { where: whereCondition }),
      Property.findAll({
        where: { add_user_id: uid },
        attributes: ["id", "title"],
      })
    ]);

    // Helper function to calculate the mode
    const calculateMode = (array) => {
      const frequencyMap = {};
      let maxCount = 0;
      let mode = null;

      array.forEach((item) => {
        frequencyMap[item] = (frequencyMap[item] || 0) + 1;
        if (frequencyMap[item] > maxCount) {
          maxCount = frequencyMap[item];
          mode = item;
        }
      });

      return mode;
    };

    // Helper function to calculate the average
    const calculateAverage = (array) => {
      if (array.length === 0) return 0; // Avoid division by zero
      const total = array.reduce((sum, value) => sum + parseFloat(value), 0);
      return total / array.length;
    };

    // Extracting data and calculating statistics
    const nightCounts = nightBookingCounts.map((entry) => parseInt(entry.getDataValue("night_count"), 10));
    const mostFrequentNight = calculateMode(nightCounts);
    const reviewRatingsArray = totalReviewsArray.map((entry) => parseFloat(entry.total_rate));
    const averageReviewRating = calculateAverage(reviewRatingsArray);
    const totalReviewCount = totalReviewsArray.length;

    // Constructing the report data
    const reportData = [
      { id:1,title: "Total Earnings", report_data: totalEarnings || 0 },
      { id:2,title: "No of Listing", report_data: totalPropertyCount || 0 },
      { id:3,title: "No of Locations", report_data: totalLocationCount || 0 },
      { id:4,title: "Total Nights Bookings", report_data: totalNightBookingCount || 0 },
      { id:5,title: "Average Nights Bookings", report_data: mostFrequentNight || 0 },
      { id:6,title: "Average Customer Reviews", report_data: averageReviewRating || 0 },
      { id:7,title: "Total Reviews", report_data: totalReviewCount || 0 },
      { title: "Property Details", report_data: propertyDetails || [] }
    ];

    // Sending the response with the report data
    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Report List Get Successfully!!!",
      report_data: reportData,
    });
  } catch (err) {
    console.error("Error fetching report data:", err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};


const TotalEarningsByMonth = async (req, res) => {
  try {
    const uid = req.user.id;
    const { propertyId } = req.query; // Accept property ID as a query parameter

    // Check if user exists
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Fetch properties owned by the user
    const userProperties = await Property.findAll({
      where: { add_user_id: uid },
      attributes: ["id"],
    });

    const userPropertyIds = userProperties.map((property) => property.id);

    if (userPropertyIds.length === 0) {
      const allMonths = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const reportData = allMonths.map((month) => ({
        month,
        totalEarnings: 0,
      }));

      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: reportData,
      });
    }

    // Build the condition for fetching bookings
    const whereCondition = {
      prop_id: propertyId ? propertyId : { [Op.in]: userPropertyIds },
      book_status: "Completed",
    };

    // Fetch monthly earnings
    const monthlyEarnings = await TblBook.findAll({
      attributes: [
        [fn("SUM", col("total")), "totalEarnings"],
        [fn("DATE_FORMAT", col("createdAt"), "%M"), "month"], // Get the month name
      ],
      where: whereCondition,
      group: ["month"],
      order: [[fn("MONTH", col("createdAt")), "ASC"]],
    });

    // Map earnings to all months
    const earningsMap = monthlyEarnings.reduce((acc, earning) => {
      acc[earning.getDataValue("month")] =
        earning.getDataValue("totalEarnings");
      return acc;
    }, {});

    // Define all months
    const allMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Format the final monthly earnings response
    const formattedMonthlyEarnings = allMonths.map((month) => ({
      month,
      totalEarnings: earningsMap[month] || 0,
    }));

    // Final response
    const reportData = [
      {
        title: propertyId
          ? `Monthly Earnings for Property ID: ${propertyId}`
          : "Total Monthly Earnings for All Properties",
        report_data: formattedMonthlyEarnings,
      },
    ];

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Report List Get Successfully!!!",
      report_data: reportData,
    });
  } catch (err) {
    console.error("Error fetching report data:", err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const listingProperties = async (req, res) => {
  try {
    const uid = req.user.id; // Get user ID from request
    const { propertyId } = req.query;

    // Validate user ID
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Fetch user properties
    const hostProperties = await Property.findAll({
      where: { add_user_id: uid },
      attributes: ["id"],
    });

    const hostPropertyIds = hostProperties.map((property) => property.id);

    // If no properties found
    if (hostPropertyIds.length === 0) {
      const allMonths = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const responseData = allMonths.map((month) => ({
        month,
        no_of_bookings: 0,
      }));

      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: responseData,
      });
    }

    // Build condition
    const currentYear = new Date().getFullYear();
    const whereCondition = {
      prop_id: propertyId ? propertyId : { [Op.in]: hostPropertyIds },
      book_status: "Completed" || "Booked" || "Confirmed",
      createdAt: {
        [Op.gte]: new Date(`${currentYear}-01-01`),
        [Op.lte]: new Date(`${currentYear}-12-31`),
      },
    };

    // Fetch bookings grouped by month
    const monthlyBookings = await TblBook.findAll({
      attributes: [
        [fn("COUNT", col("id")), "no_of_bookings"], // Count bookings
        [fn("DATE_FORMAT", col("createdAt"), "%M"), "month"], // Get month name
      ],
      where: whereCondition,
      group: ["month"],
      order: [[fn("MONTH", col("createdAt")), "ASC"]], // Order by month
    });

    // Map bookings to a dictionary
    const bookingsMap = monthlyBookings.reduce((acc, booking) => {
      acc[booking.getDataValue("month")] =
        booking.getDataValue("no_of_bookings");
      return acc;
    }, {});

    // Define all months
    const allMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Format final response
    const formattedMonthlyBookings = allMonths.map((month) => ({
      month,
      no_of_bookings: bookingsMap[month] || 0, // Default to 0 if no data
    }));

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Report List Get Successfully!!!",
      report_data: {
        title: propertyId
          ? `Monthly Bookings for Property ID: ${propertyId}`
          : "Total Monthly Bookings for All Properties",
        report_data: formattedMonthlyBookings,
      },
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const listByLocations = async (req, res) => {
  try {
    const uid = req.user.id; // Get user ID from request

    // Validate user ID
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Check if the user is a host
    const hostExists = await Property.findOne({ where: { add_user_id: uid } });

    if (!hostExists) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "Access Denied! You are not authorized to view this data.",
      });
    }

    // Fetch properties grouped by city for the logged-in host
    const propertiesByLocation = await Property.findAll({
      attributes: [
        [fn("COUNT", col("id")), "no_of_properties"], // Count properties
        "city", // Group by city
      ],
      where: { add_user_id: uid },
      group: ["city"],
      order: [[fn("COUNT", col("id")), "DESC"]], // Order by number of properties
    });

    // If no properties found, return empty response
    if (propertiesByLocation.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    // Format the response data correctly using city as location
    const formattedLocationData = propertiesByLocation.map((property) => ({
      location: property.city, // Correct field name from property table
      no_of_properties: property.getDataValue("no_of_properties"),
    }));

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property count by location fetched successfully!",
      report_data: formattedLocationData,
    });
  } catch (error) {
    console.error("Error fetching properties by location:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const averageCustomerReviews = async (req, res) => {
  try {
    const uid = req.user.id; // Get user ID from request

    // Validate user ID
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Check if the user is a host
    const hostExists = await Property.findOne({ where: { add_user_id: uid } });

    if (!hostExists) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "Access Denied! You are not authorized to view this data.",
      });
    }

    // Check if the user has properties in bookings
    const hostProperties = await TblBook.findAll({
      where: { add_user_id: uid },
      attributes: ["prop_id", "prop_title"],
      group: ["prop_id", "prop_title"],
    });

    if (hostProperties.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    const currentYear = new Date().getFullYear();

    // Fetch average customer reviews for host properties in the current year
    const averageReviews = await TblBook.findAll({
      attributes: [
        "prop_id",
        [fn("AVG", col("total_rate")), "average_no_of_reviews"],
      ],
      where: {
        add_user_id: uid,
        total_rate: { [Op.gt]: 0 }, // Consider only rated properties
        createdAt: {
          [Op.gte]: new Date(`${currentYear}-01-01`),
          [Op.lte]: new Date(`${currentYear}-12-31`),
        },
      },
      group: ["prop_id"],
    });

    // Map property titles with their corresponding average reviews
    const reviewMap = averageReviews.reduce((acc, review) => {
      acc[review.prop_id] = review.getDataValue("average_no_of_reviews");
      return acc;
    }, {});

    const formattedReviewData = hostProperties.map((property) => ({
      property_name: property.prop_title,
      average_no_of_reviews: reviewMap[property.prop_id]
        ? parseFloat(reviewMap[property.prop_id].toFixed(1))
        : 0,
    }));

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Average reviews fetched successfully!",
      report_data: formattedReviewData,
    });
  } catch (error) {
    console.error("Error fetching average reviews:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const totalReviewCount = async (req, res) => {
  try {
    const uid = req.user.id; // Get user ID from request

    // Validate user ID
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Check if the user is a host
    const hostExists = await Property.findOne({ where: { add_user_id: uid } });

    if (!hostExists) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "Access Denied! You are not authorized to view this data.",
      });
    }

    // Extract month and year from query params (format: YYYY-MM)
    const { month } = req.query;
    let reviewWhereCondition = { add_user_id: uid, total_rate: { [Op.gt]: 0 } };

    if (month) {
      const [year, monthNum] = month.split("-");
      reviewWhereCondition.createdAt = {
        [Op.gte]: new Date(`${year}-${monthNum}-01`),
        [Op.lt]: new Date(`${year}-${parseInt(monthNum) + 1}-01`),
      };
    }

    // Fetch all properties for the host
    const hostProperties = await TblBook.findAll({
      where: { add_user_id: uid },
      attributes: ["prop_id", "prop_title"],
      group: ["prop_id", "prop_title"],
    });

    if (hostProperties.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    // Fetch total review count for each property
    const reviewCounts = await TblBook.findAll({
      attributes: ["prop_id", [fn("COUNT", col("id")), "total_reviews"]],
      where: reviewWhereCondition,
      group: ["prop_id"],
    });

    // Create a map of property IDs and their review counts
    const reviewMap = reviewCounts.reduce((acc, review) => {
      acc[review.prop_id] = review.getDataValue("total_reviews");
      return acc;
    }, {});

    // Format the response data including properties with zero reviews
    const formattedReviewData = hostProperties.map((property) => ({
      property_name: property.prop_title,
      total_reviews: reviewMap[property.prop_id] || 0, // Default to 0 if no reviews
    }));

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Total reviews fetched successfully!",
      report_data: formattedReviewData,
    });
  } catch (error) {
    console.error("Error fetching total review count:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const totalNightsBookedByTraveler = async (req, res) => {
  try {
    const uid = req.user.id; // Get user ID from request

    // Validate user ID
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Check if the user is a host
    const hostExists = await Property.findOne({ where: { add_user_id: uid } });

    if (!hostExists) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "Access Denied! You are not authorized to view this data.",
      });
    }

    const { property_id } = req.query; // Optional property filter
    const currentYear = new Date().getFullYear();

    // Base where condition to fetch the host's properties
    let whereCondition = {
      add_user_id: uid,
      check_in: { [Op.gte]: new Date(`${currentYear}-01-01`) },
    };

    if (property_id) {
      whereCondition.prop_id = property_id;
    }

    // Fetch all properties of the host (filtered by property_id if provided)
    const hostProperties = await TblBook.findAll({
      where: whereCondition, // Apply the filter conditions
      attributes: ["prop_id", "prop_title"],
      group: ["prop_id", "prop_title"],
    });

    if (hostProperties.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    // Helper function to get the month name
    const getMonthName = (monthNumber) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return months[monthNumber - 1]; // Convert month number to name
    };

    // Query to fetch the total nights booked month-wise (same filter applied)
    const bookedNights = await TblBook.findAll({
      attributes: [
        "prop_id",
        [fn("MONTH", col("check_in")), "month"],
        [fn("SUM", literal("DATEDIFF(check_out, check_in)")), "total_nights"],
      ],
      where: whereCondition, // Apply the filter conditions
      group: ["prop_id", "month"],
      order: [[col("month"), "ASC"]],
    });

    // Create a map of property bookings by month
    const bookingsMap = bookedNights.reduce((acc, booking) => {
      const key = `${booking.prop_id}-${booking.getDataValue("month")}`;
      acc[key] = booking.getDataValue("total_nights");
      return acc;
    }, {});

    // Prepare the response with months from January to December using month names
    const formattedData = hostProperties.map((property) => {
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: getMonthName(i + 1), // Get the month name instead of the number
        total_nights: bookingsMap[`${property.prop_id}-${i + 1}`] || 0, // Default to 0 if no bookings
      }));

      return {
        property_name: property.prop_title,
        property_id: property.prop_id,
        monthly_nights: monthlyData,
      };
    });

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Total nights booked fetched successfully!",
      report_data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching total nights booked:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const averageNightBookingByTraveler = async (req, res) => {
  try {
    const uid = req.user.id; // Get user ID from request

    // Validate user ID
    if (!uid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Check if the user is a host
    const hostExists = await Property.findOne({ where: { add_user_id: uid } });

    if (!hostExists) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "Access Denied! You are not authorized to view this data.",
      });
    }

    const { property_id } = req.query; // Optional property filter
    const currentYear = new Date().getFullYear();

    // Base where condition to fetch the host's properties
    let whereCondition = {
      add_user_id: uid,
      check_in: { [Op.gte]: new Date(`${currentYear}-01-01`) }, // Filter for current year
    };

    if (property_id) {
      whereCondition.prop_id = property_id; // Filter for specific property if provided
    }

    // Fetch the host's properties (filtered by property_id if provided)
    const hostProperties = await TblBook.findAll({
      where: whereCondition, // Apply the filter conditions
      attributes: ["prop_id", "prop_title"],
      group: ["prop_id", "prop_title"],
    });

    if (hostProperties.length === 0) {
      return res.json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "No properties found for the user.",
        report_data: [],
      });
    }

    // Helper function to get the month name
    const getMonthName = (monthNumber) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return months[monthNumber - 1]; // Convert month number to name
    };

    // Query to fetch the total nights booked month-wise (same filter applied)
    const bookedNights = await TblBook.findAll({
      attributes: [
        "prop_id",
        [fn("MONTH", col("check_in")), "month"],
        [fn("SUM", literal("DATEDIFF(check_out, check_in)")), "total_nights"],
      ],
      where: whereCondition, // Apply the filter conditions
      group: ["prop_id", "month"],
      order: [[col("month"), "ASC"]],
    });

    // Create a map of property bookings by month
    const bookingsMap = bookedNights.reduce((acc, booking) => {
      const key = `${booking.prop_id}-${booking.getDataValue("month")}`;
      acc[key] = booking.getDataValue("total_nights");
      return acc;
    }, {});

    // Prepare the response with months from January to December using month names
    const formattedData = hostProperties.map((property) => {
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const totalNights = bookingsMap[`${property.prop_id}-${i + 1}`] || 0; // Default to 0 if no bookings
        return {
          month: getMonthName(i + 1),
          avg_no_of_nights: parseFloat((totalNights / 12).toFixed(2)), // Calculate average for the month
        };
      });

      // Return the final formatted data with the month and avg_no_of_nights
      return monthlyData;
    });

    res.json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Average nights booked fetched successfully!",
      report_data: formattedData.flat(), // Flatten to get all months in a single array
    });
  } catch (error) {
    console.error("Error fetching average nights booked:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

module.exports = {
  dashboardData,
  TotalEarningsByMonth,
  listingProperties,
  listByLocations,
  averageCustomerReviews,
  totalReviewCount,
  totalNightsBookedByTraveler,
  averageNightBookingByTraveler,
};
