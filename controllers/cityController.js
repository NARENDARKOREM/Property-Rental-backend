const TblCity = require("../models/TblCity");
const uploadToS3 = require("../config/fileUpload.aws");
const { where } = require("sequelize");
const { TblCountry } = require("../models");
const sequelize = require("../db");

const upsertCity = async (req, res, next) => {
  try {
    const { id, title, status, country_id } = req.body;
    console.log("req bodyyyyyyyyyyyyyyy", req.body);

    if (!country_id) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Country is required for the city.",
      });
    }

    const country = await TblCountry.findByPk(country_id);
    if (!country) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Country not found.",
      });
    }

    let imageUrl;

    if (req.file) {
      // Upload file to S3 and get the URL
      imageUrl = await uploadToS3(req.file, "cities");
    } else if (!id) {
      return res
        .status(400)
        .json({ error: "Image is required for a new city." });
    }

    let city;
    if (id) {
      city = await TblCity.findByPk(id);
      if (!city) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "City not found.",
        });
      }

      // Update city details
      await city.update({
        title,
        img: imageUrl || city.img, // Use existing image if no new one is uploaded
        status,
        country_id,
      });

      return res.status(201).json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "City updated successfully.",
        city,
      });
    } else {
      city = await TblCity.create({
        title,
        img: imageUrl,
        status,
        country_id,
      });

      return res.status(200).json({
        ResponseCode: "201",
        Result: "true",
        ResponseMsg: "City created successfully.",
        city,
      });
    }
  } catch (error) {
    console.error("Error processing city:", error);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};


// const getCities = async (req, res) => {
//   try {
//     const cities = await TblCity.findAll({
//       include: [
//         {
//           model: TblCountry,
//           as: "country",
//           // attributes: [[sequelize.col('title'), 'countryName']], 
//           attributes: [["title", "countryName"]],
//         },
//       ],
//     });

//     // Format cities with their country names
//     const formattedCities = cities.map((city) => ({
//       id: city.id,
//       title: `${city.title} (${city.country.countryName})`,
//     }));

//     return res.status(200).json({
//       ResponseCode: "200",
//       Result: "true",
//       ResponseMsg: "Cities fetched successfully",
//       cities: formattedCities,
//     });
//   } catch (error) {
//     console.error("Error fetching cities:", error);
//     return res.status(500).json({
//       ResponseCode: "500",
//       Result: "false",
//       ResponseMsg: "Internal Server Error",
//     });
//   }
// };

const getCities = async (req, res) => {
  try {
    const cities = await TblCity.findAll({
      include: [
        {
          model: TblCountry,
          as: "country",
          attributes: ["title"],
          where: { deletedAt:null },
          required:true

        },
      ],
    });

    console.log("Fetched Cities Data:", JSON.stringify(cities, null, 2));

    const formattedCities = cities.map((city) => ({
      id: city.id,
      title: `${city.title} (${city.country ? city.country.title : "No Country Found"})`,
    }));


    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Cities fetched successfully",
      cities: cities,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};


const toggleCityStatus = async (req, res) => {
  const { id, field, value } = req.body;
  // console.log(req.body)
  try {
    if (id === undefined || field === undefined || value === undefined) {
      return res.status(400).json({ message: "Invalid request!" });
    }
    console.log("Updating city status...", id, field, value);

    if (!["status"].includes(field)) {
      console.error(`Invalid field: ${field}`);
      return res.status(400).json({ message: "Invalid field!" });
    }

    const city = await TblCity.findByPk(id);
    if (!city) {
      console.error(`City with id ${id} not found.`);
      return res.status(404).json({ message: "City not found." });
    }

    city[field] = value;
    await city.save();
    console.log("City status updated", city);

    res.status(200).json({
      message: `${field} updated successfully.`,
      updatedField: field,
      updatedValue: value,
      city: city,
    });
  } catch (error) {
    console.error("Error updating city status:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating city status." });
  }
};

const deleteCity = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;
  console.log(id);

  try {
    const city = await TblCity.findOne({ where: { id }, paranoid: false });

    if (!city) {
      return res.status(404).json({ message: "City not found!" });
    }

    if (city.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ message: "City already deleted!" });
    }

    if (forceDelete === "true") {
      await city.destroy({ force: true });
      return res.status(200).json({ message: "City permanently deleted!" });
    } else {
      await city.destroy();
      return res
        .status(200)
        .json({ message: "City soft deleted successfully!" });
    }
  } catch (error) {
    console.error("Error deleting city:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the city." });
  }
};

const getCityById = async (req,res) => {
  const { id } = req.params;
  try {
    const city = await TblCity.findOne({ where: { id } });
    if (!city) {
      return res.status(404).json({ message: "City not found!" });
    }
    return res.status(200).json(city);
  } catch (error) {
    console.error("Error getting city by id:", error);
    res
      .status(500)
      .json({ message: "An error occurred while getting the city." });
  }
};

module.exports = { upsertCity, getCities, deleteCity, toggleCityStatus, getCityById };
