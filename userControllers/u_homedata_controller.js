const { Sequelize } = require("sequelize");
const { User, TblCategory, Property } = require("../models");
const TblFav = require("../models/TblFav");

const homeDataApi = async (req, res) => {
    const { uid, country_id } = req.body;
  
    if (!country_id) {
      return res.status(400).json({
        ResponseCode: '401',
        Result: 'false',
        ResponseMsg: 'Something Went Wrong!',
      });
    }
  
    try {
      const categories = await TblCategory.findAll({ where: { status: 1 } });
      const categoryList = categories.map((category) => ({
        id: category.id,
        title: category.title,
        img: category.img,
        status: category.status,
      }));
      categoryList.unshift({ id: 0, title: 'All', img: 'images/category/grid-circle.png', status: 1 });
  
     
      const propertyCondition = uid === 0
        ? { country_id, status: 1}
        : { country_id, status: 1,  add_user_id: { [Sequelize.Op.ne]: uid } };
      const featuredProperties = await Property.findAll({
        where: propertyCondition,
        order: [['id', 'DESC']],
        limit: 5,
      });

      const featured = await Promise.all(
        featuredProperties.map(async (property) => {
          const favoriteCount = await TblFav.count({ where: { uid, property_id: property.id } });
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
  
      
      const allProperties = await Property.findAll({ where: propertyCondition });
  
      const cateWiseProperties = await Promise.all(
        allProperties.map(async (property) => {
          const favoriteCount = await TblFav.count({ where: { uid, property_id: property.id } });
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
  
      
      const homeData = {
        Catlist: categoryList,
        Featured_Property: featured,
        cate_wise_property: cateWiseProperties,
        show_add_property: true, 
      };
  
      return res.status(200).json({
        ResponseCode: '200',
        Result: 'true',
        ResponseMsg: 'Home Data Get Successfully!',
        HomeData: homeData,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        ResponseCode: '500',
        Result: 'false',
        ResponseMsg: 'Internal Server Error!',
      });
    }
}

module.exports = { homeDataApi}