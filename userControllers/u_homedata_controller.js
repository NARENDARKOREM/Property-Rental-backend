const { Sequelize } = require("sequelize");
const { User, TblCategory, Property, TblCountry } = require("../models");
const TblFav = require("../models/TblFav");

// const homeDataApi = async (req, res) => {
//   const uid = req.user?.id || 0;

//   if (!uid) {
//     const { country_id } = req.query;
//     console.log(country_id, "from parammmmmmmmsssssssssssssss")

//     if (!country_id) {
//       return res.status(400).json({
//         ResponseCode: "401",
//         Result: "false",
//         ResponseMsg: "COuntry Id is required!",
//       });
//     }

//     try {
//       const categories = await TblCategory.findAll({ where: { status: 1 } });
//       const categoryList = categories.map((category) => ({
//         id: category.id,
//         title: category.title,
//         img: category.img,
//         status: category.status,
//       }));
//       categoryList.unshift({
//         id: 0,
//         title: "All",
//         img: "https://servo-stay.s3.eu-north-1.amazonaws.com/all.svg",
//         status: 1,
//       });

//       const featuredProperties = await Property.findAll({
//         where: { country_id, status: 1 },
//         order: [["id", "DESC"]],
//         limit: 5,
//       });

//       const featured = await Promise.all(
//         featuredProperties.map(async (property) => {
//           return {
//             id: property.id,
//             title: property.title,
//             latitude: property.latitude,
//             longtitude: property.longtitude,
//             plimit: property.plimit,
//             rate: property.rate,
//             city: property.city,
//             property_type: property.ptype,
//             beds: property.beds,
//             bathroom: property.bathroom,
//             sqrft: property.sqrft,
//             image: property.image,
//             price: property.price,
//           };
//         })
//       );

//       const allProperties = await Property.findAll({
//         where: { country_id, status: 1 },
//       });

//       const cateWiseProperties = await Promise.all(
//         allProperties.map(async (property) => {
//           return {
//             id: property.id,
//             title: property.title,
//             buyorrent: property.pbuysell,
//             latitude: property.latitude,
//             longtitude: property.longtitude,
//             plimit: property.plimit,
//             rate: property.rate,
//             city: property.city,
//             beds: property.beds,
//             bathroom: property.bathroom,
//             sqrft: property.sqrft,
//             property_type: property.ptype,
//             image: property.image,
//             price: property.price,
//           };
//         })
//       );
//       const country = await TblCountry.findOne({
//         attributes: ["currency"],
//         where: {
//           id: country_id, // Use country_id to filter
//           status: 1,
//         },
//       });

//       const homeData = {
//         Catlist: categoryList,
//         Featured_Property: featured,
//         cate_wise_property: cateWiseProperties,
//         currency: country.currency,
//         show_add_property: true,
//       };
//       return res.status(200).json({
//         ResponseCode: "200",
//         Result: "true",
//         ResponseMsg: "Home Data Get Successfully!",
//         HomeData: homeData,
//       });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({
//         ResponseCode: "500",
//         Result: "false",
//         ResponseMsg: "Internal Server Error!",
//       });
//     }
//   }

//   const user = await User.findByPk(uid,{
//     attributes:["id","country_id"]
//   });
//   console.log("User Object:", JSON.stringify(user, null, 2));
//   console.log("User Object:", user);
//   const country_id = user?.country_id;
//   console.log("Country ID:", user?.country_id, "from userrrrrrrrrrrrrrrrrrrrrr");
//   if (!country_id) {
//     return res.status(400).json({
//       ResponseCode: "401",
//       Result: "false",
//       ResponseMsg: "Country Id is Required!",
//     });
//   }

//   try {
//     const categories = await TblCategory.findAll({ where: { status: 1 } });
//     const categoryList = categories.map((category) => ({
//       id: category.id,
//       title: category.title,
//       img: category.img,
//       status: category.status,
//     }));
//     categoryList.unshift({
//       id: 0,
//       title: "All",
//       img: "https://servostay-images.s3.us-east-1.amazonaws.com/all.svg",
//       status: 1,
//     });

//     const propertyCondition =
//       uid === 0
//         ? { country_id, status: 1 }
//         : { country_id, status: 1, add_user_id: { [Sequelize.Op.ne]: uid } };
//     const featuredProperties = await Property.findAll({
//       where: propertyCondition,
//       order: [["id", "DESC"]],
//       limit: 5,
//     });

//     const featured = await Promise.all(
//       featuredProperties.map(async (property) => {
//         const favoriteCount = await TblFav.count({
//           where: { uid, property_id: property.id },
//         });
//         return {
//           id: property.id,
//           title: property.title,
//           latitude: property.latitude,
//           longtitude: property.longtitude,
//           plimit: property.plimit,
//           rate: property.rate,
//           city: property.city,
//           property_type: property.ptype,
//           beds: property.beds,
//           bathroom: property.bathroom,
//           sqrft: property.sqrft,
//           image: property.image,
//           price: property.price,
//           IS_FAVOURITE: favoriteCount,
//         };
//       })
//     );

//     const allProperties = await Property.findAll({ where: propertyCondition });

//     const cateWiseProperties = await Promise.all(
//       allProperties.map(async (property) => {
//         const favoriteCount = await TblFav.count({
//           where: { uid, property_id: property.id },
//         });
//         return {
//           id: property.id,
//           title: property.title,
//           buyorrent: property.pbuysell,
//           latitude: property.latitude,
//           longtitude: property.longtitude,
//           plimit: property.plimit,
//           rate: property.rate,
//           city: property.city,
//           beds: property.beds,
//           bathroom: property.bathroom,
//           sqrft: property.sqrft,
//           property_type: property.ptype,
//           image: property.image,
//           price: property.price,
//           IS_FAVOURITE: favoriteCount,
//         };
//       })
//     );

//     const country = await TblCountry.findOne({
//       attributes: ["currency"],
//       where: {
//         id: country_id, // Use country_id to filter
//         status: 1,
//       },
//     });

//     const homeData = {
//       Catlist: categoryList,
//       Featured_Property: featured,
//       cate_wise_property: cateWiseProperties,
//       currency: country.currency,
//       show_add_property: true,
//     };

//     return res.status(200).json({
//       ResponseCode: "200",
//       Result: "true",
//       ResponseMsg: "Home Data Get Successfully!",
//       HomeData: homeData,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       ResponseCode: "500",
//       Result: "false",
//       ResponseMsg: "Internal Server Error!",
//     });
//   }
// };

const homeDataApi = async (req, res) => {
  const uid = req.user?.id || null;
  let country_id;

  // Determine country_id
  if (uid) {
    const user = await User.findByPk(uid, { attributes: ["id", "country_id"] });
    console.log("User Object:", JSON.stringify(user, null, 2));
    country_id = user?.country_id;

    if (!country_id) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Country ID is required in user profile!",
      });
    }
  } else {
    country_id = req.query.country_id;
    console.log("Country ID from query:", country_id);

    if (!country_id) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Country ID is required in query parameter!",
      });
    }
  }

  try {
    // Fetch categories
    const categories = await TblCategory.findAll({ where: { status: 1 } });
    const categoryList = categories.map((category) => ({
      id: category.id,
      title: category.title,
      img: category.img,
      status: category.status,
    }));
    categoryList.unshift({
      id: 0,
      title: "All",
      img: "https://servostay-images.s3.us-east-1.amazonaws.com/all.svg",
      status: 1,
    });

    // Consistent property condition (no add_user_id filter unless needed)
    const propertyCondition = { country_id, status: 1 };

    // Fetch featured properties (always limit to 5)
    const featuredProperties = await Property.findAll({
      where: propertyCondition,
      order: [["id", "DESC"]],
      limit: 5,
    });

    const featured = await Promise.all(
      featuredProperties.map(async (property) => {
        const favoriteCount = uid
          ? await TblFav.count({ where: { uid, property_id: property.id } })
          : 0;
        return {
          id: property.id,
          title: property.title,
          latitude: property.latitude,
          longtitude: property.longtitude,
          plimit: property.plimit,
          rate: property.rate,
          city: property.city,
          property_type: property.ptype,
          beds: property.beds,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          image: property.image,
          price: property.price,
          IS_FAVOURITE: favoriteCount,
        };
      })
    );

    // Fetch all properties
    const allProperties = await Property.findAll({ where: propertyCondition });

    const cateWiseProperties = await Promise.all(
      allProperties.map(async (property) => {
        const favoriteCount = uid
          ? await TblFav.count({ where: { uid, property_id: property.id } })
          : 0;
        return {
          id: property.id,
          title: property.title,
          buyorrent: property.pbuysell,
          latitude: property.latitude,
          longtitude: property.longtitude,
          plimit: property.plimit,
          rate: property.rate,
          city: property.city,
          beds: property.beds,
          bathroom: property.bathroom,
          sqrft: property.sqrft,
          property_type: property.ptype,
          image: property.image,
          price: property.price,
          IS_FAVOURITE: favoriteCount,
        };
      })
    );

    // Fetch country currency
    const country = await TblCountry.findOne({
      attributes: ["currency"],
      where: { id: country_id, status: 1 },
    });

    if (!country) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Invalid or inactive country ID!",
      });
    }

    const homeData = {
      Catlist: categoryList,
      Featured_Property: featured,
      cate_wise_property: cateWiseProperties,
      currency: country.currency,
      show_add_property: true,
    };

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Home Data Fetched Successfully!",
      HomeData: homeData,
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
      error: error.message,
    });
  }
};

module.exports = { homeDataApi };
