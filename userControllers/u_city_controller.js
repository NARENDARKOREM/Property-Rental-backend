const { where } = require("sequelize");
const TblCity = require("../models/TblCity");
const TblCountry = require("../models/TblCountry");

const getActiveCities = async (req, res) => {
  const { country_id } = req.body;
  try {
    const cities = await TblCity.findAll({
      where: { status: 1, country_id: country_id },
      include: [
        {
          model: TblCountry,
          as: "country", // Use the alias here
          attributes: ["title"],
          where: { deletedAt: null },
          required: true,
        },
      ],
    });

    if (!cities || cities.length === 0) {
      return res.status(400).json({ error: "Cities not found" });
    }

    const formattedCities = cities.map((city) => ({
      id: city.id,
      title: `${city.title} (${city.country.title})`, // Access the country title using the alias
      img:city.img
    }));

    return res.status(200).json({
      message: "Cities Fetched Successfully",
      formattedCities,
    });
  } catch (error) {
    console.error("Error fetching cities", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = { getActiveCities };

