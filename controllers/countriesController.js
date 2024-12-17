const TblCountry = require("../models/TblCountry");
const fs = require("fs");
const path = require("path");
const Property = require("../models/Property");
const { Sequelize } = require("sequelize");
const { count } = require("console");

// Create or Update Country
const upsertCountry = async (req, res) => {
  const { id, title, status, img } = req.body;
  console.log(req.body);

  try {
    if (id) {
      // Update country
      const country = await TblCountry.findByPk(id);
      if (!country) {
        return res.status(404).json({ error: "Country not found" });
      }

      country.title = title;
      country.img = img;
      country.status = status;

      await country.save();
      res
        .status(200)
        .json({ message: "Country updated successfully", country });
    } else {
      // Create new country
      const country = await TblCountry.create({
        title,
        img,
        status,
        d_con: 0,
      });
      res
        .status(201)
        .json({ message: "Country created successfully", country });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Countries
const getAllCountries = async (req, res) => {
  try {
    const countries = await TblCountry.findAll();
    res.status(200).json(countries);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Counties Count
const getCountryCount = async (req, res) => {
  try {
    const countryCount = await TblCountry.count();
    res.status(200).json({ count: countryCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Single Country by ID
const getCountryById = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await TblCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }
    res.status(200).json(country);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Country
const deleteCountry = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const country = await TblCountry.findOne({
      where: { id },
      paranoid: false,
    });
    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }

    if (country.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ error: "Country is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (country.img && !country.img.startsWith("http")) {
        fs.unlinkSync(path.join(__dirname, "..", country.img)); // Remove image file if it's a local path
      }
      await country.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Country permanently deleted successfully" });
    } else {
      await country.destroy();
      res.status(200).json({ message: "Country soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const fetchCountriesWithPropertyCount = async (req, res) => {
  try {
    console.log("Fetching countries with property count");

    const countries = await TblCountry.findAll({
      include: [
        {
          model: Property,
          as: "properties",
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "id",
        "title",
        [
          Sequelize.fn("COUNT", Sequelize.col("properties.id")),
          "property_count",
        ],
      ],
      group: ["TblCountry.id"],
      logging: (sql) => {
        console.log("Generated SQL:", sql); // Logs the generated SQL query
      },
    });

    console.log("Countries fetched:", countries);

    if (countries.length === 0) {
      return res.status(404).json({ error: "Country not found" });
    }

    res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching property counts:", error.message);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
};

module.exports = {
  upsertCountry,
  getAllCountries,
  getCountryById,
  deleteCountry,
  fetchCountriesWithPropertyCount,
  getCountryCount,
};
