const TblCity = require("../models/TblCity");
const uploadToS3 = require("../config/fileUpload.aws");
const { where } = require("sequelize");

const upsertCity = async (req, res, next) => {
    try {
      const { id, title, status } = req.body;
  
      let imageUrl;
  
      if (req.file) {
        // Upload file to S3 and get the URL
        imageUrl = await uploadToS3(req.file, "cities");
      } else if (!id) {
        return res.status(400).json({ error: "Image is required for a new city." });
      }
  
      let city;
      if (id) {
        city = await TblCity.findByPk(id);
        if (!city) {
          return res.status(404).json({ ResponseCode: "404", Result: "false", ResponseMsg: "City not found." });
        }
  
        // Update city details
        await city.update({
          title,
          img: imageUrl || city.img,  // Use existing image if no new one is uploaded
          status,
        });
  
        return res.status(200).json({
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
        });
  
        return res.status(201).json({
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
  

const getActiveCities = async (req, res) => {
  try {
    const activeCities = await TblCity.findAll({ where: { status: 1 } });
    if (activeCities.length === 0) {
      return res.status(404).json({ message: "No active cities found!" });
    }
    res
      .status(200)
      .json({ message: "Active cities found!", cities: activeCities });
  } catch (error) {
    console.error("Error fetching active cities:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching cities." });
  }
};

module.exports = { upsertCity, getActiveCities };
