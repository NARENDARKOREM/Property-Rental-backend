const { where } = require("sequelize");
const TblCity = require("../models/TblCity");
const TblCountry = require("../models/TblCountry");

const getActiveCities = async (req, res) => {
  try {
    const cities = await TblCity.findAll({
      where: { status: 1 },
      //   attributes: ["id", "title"],
      include: [
        {
          model: TblCountry,
          attributes: ["title"],
          where: { deletedAt: null },
          required: true,
        },
      ],
    });

    if (!cities || cities.length === 0) {
      return res.status(400).json({ error: "Cities not found" });
    }

    return res.status(200).json({
      message: "Cities Fetched Successfully",
      cities,
    });
  } catch (error) {
    console.error("Error fetching cities", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getActiveCities };
