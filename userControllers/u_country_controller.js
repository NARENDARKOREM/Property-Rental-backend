const TblCountry=require("../models/TblCountry")
const {Op} =require("sequelize")

const getAllCountry=  async (req, res) => {
    
  
    try {
      const countries = await TblCountry.findAll({
        where: { status: 1 },
        attributes: ['id', 'title',"img"], 
      });
  
      if (countries.length === 0) {
        return res.json({
          CountryData: [],
          ResponseCode: '200',
          Result: 'false',
          ResponseMsg: 'Country List Not Found!',
        });
      }
  
      const countryData = countries.map((country) => ({
        id: country.id,
        title: country.title,
        img: country.img,
      }));
  
      res.json({
        CountryData: countryData,
        ResponseCode: '200',
        Result: 'true',
        ResponseMsg: 'Country List Get Successfully!!',
      });
    } catch (error) {
      console.error('Error fetching country list:', error.message);
  
      res.status(500).json({
        ResponseCode: '500',
        Result: 'false',
        ResponseMsg: 'Internal Server Error',
      });
    }
  };


module.exports={getAllCountry}  