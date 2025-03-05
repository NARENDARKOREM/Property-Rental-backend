// controllers/user_fav_controller.js
const TblFav = require("../models/TblFav");
const Property = require("../models/Property");
const TblBook = require("../models/TblBook"); // Assume you have this model defined

const { Op } = require("sequelize"); // Import Sequelize operators

// Toggle favorite property
const toggleFavorite = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User not found!",
    });
  }
  const { pid, property_type } = req.body;
  console.log(uid);

  if (!pid || !property_type) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "All Fields Required!",
    });
  }

  try {
    const existingFav = await TblFav.findOne({
      where: { uid, property_id: pid, property_type },
    });

    if (existingFav) {
      await existingFav.destroy();
      return res.status(200).json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Property successfully removed from favorite list!",
      });
    } else {
      await TblFav.create({ uid, property_id: pid, property_type });
      return res.status(200).json({ 
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Property successfully added in favorite list!",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite property:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal server error.",
    });
  }
};

// Get favorite properties list
// const getFavoriteList = async (req, res) => {
//   const { property_type, country_id } = req.body;
//   const uid = req.user.id;

//   if (!uid || !property_type || !country_id) {
//     return res.status(400).json({
//       ResponseCode: "401",
//       Result: "false",
//       ResponseMsg: "Something went wrong!",
//     });
//   }

//   try {
//     const favorites = await TblFav.findAll({
//       where: property_type === 0 ? { uid } : { uid, property_type },
//     });

//     const favoriteList = [];

//     for (const fav of favorites) {
//       const property = await Property.findOne({
//         where: { id: fav.property_id, country_id },
//       });

//       if (property) {
//         favoriteList.push({
//           id: property.id,
//           title: property.title,
//           rate: await getPropertyRate(property.id),
//           city: property.city,
//           buyorrent: property.pbuysell,
//           plimit: property.plimit,
//           property_type: property.ptype,
//           image: property.image,
//           price: property.price,
//           IS_FAVOURITE: true,
//         });
//       }
//     }

//     if (favoriteList.length === 0) {
//       return res.status(200).json({
//         propetylist: favoriteList,
//         ResponseCode: "200",
//         Result: "false",
//         ResponseMsg: "Favorite property not found!",
//       });
//     } else {
//       return res.status(200).json({
//         propetylist: favoriteList,
//         ResponseCode: "200",
//         Result: "true",
//         ResponseMsg: "Favorite property list found!",
//       });
//     }
//   } catch (error) {
//     console.error("Error fetching favorite list:", error);
//     return res.status(500).json({
//       ResponseCode: "500",
//       Result: "false",
//       ResponseMsg: "Internal server error.",
//     });
//   }
// };

const getFavoriteList = async (req, res) => {
  const uid = req.user.id;

  if (!uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User not found!",
    });
  }

  try {
    // Fetch favorites along with property details
    const favorites = await TblFav.findAll({
      where: { uid },
      include: [
        {
          model: Property,
          as: "property", // Ensure alias matches the association
          attributes: [
            "id",
            "title",
            "image",
            "price",
            "city",
            "is_sell",
            "ptype",
          ],
        },
      ],
    });

    if (!favorites.length) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No favorites found!",
      });
    }

    // Map the favorite properties
    const favoriteList = await Promise.all(
      favorites
        .filter((fav) => fav.property) // Filter out null properties
        .map(async (fav) => {
          const property = fav.property;
          return {
            id: property.id,
            title: property.title,
            rate: await getPropertyRate(property.id),
            city: property.city,
            buyorrent: property.is_sell,
            property_type: property.ptype,
            image: property.image,
            price: property.price,
            IS_FAVOURITE: true,
          };
        })
    );
    

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Favorite list fetched successfully!",
      data: favoriteList,
    });
  } catch (error) {
    console.error("Error fetching favorite list:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal server error.",
    });
  }
};

// Helper function to get property rate
async function getPropertyRate(propertyId) {
  const bookings = await TblBook.findAll({
    where: {
      prop_id: propertyId,
      book_status: "Completed",
      total_rate: { [Op.ne]: 0 },
    },
  });

  if (bookings.length === 0) {
    const property = await Property.findByPk(propertyId);
    return property ? property.rate : 0;
  }

  const totalRate = bookings.reduce(
    (sum, booking) => sum + booking.total_rate,
    0
  );
  return (totalRate / bookings.length).toFixed(2);
}

module.exports = {
  toggleFavorite,
  getFavoriteList,
};
