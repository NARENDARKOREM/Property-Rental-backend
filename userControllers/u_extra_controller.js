const TblExtra=require("../models/TblExtra")
const Property=require("../models/Property")
const {Op} =require("sequelize")

const getAllExtraImg=  async (req, res) => {
    const { uid } = req.body;
  
    if (!uid) {
      return res.json({
        ResponseCode: '401',
        Result: 'false',
        ResponseMsg: 'Something Went Wrong!',
      });
    }
  
    try {
      const extraImg = await TblExtra.findAll({
        where: { status: 1 },
        attributes: ['id', 'title',"img"], 
      });
  
      if (extraImg.length === 0) {
        return res.json({
          CountryData: [],
          ResponseCode: '200',
          Result: 'false',
          ResponseMsg: 'Country List Not Found!',
        });
      }
  
      const extraimgData = extraImg.map((extraimg) => ({
        id: extraimg.id,
        title: extraimg.title,
        img: extraimg.img,
      }));
  
      res.json({
        CountryData: extraimgData,
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

const addEditExtraImg = async (req, res) => {
    try {
        const { status, prop_id, uid, record_id,img } = req.body;
  
      // Validate incoming data
      if (!status || !prop_id || !uid || !record_id ) {
        return res.status(400).json({
          ResponseCode: "401",
          Result: "false",
          ResponseMsg: "Missing required fields!"
        });
      }
  
      // Check if the user owns the property
      const property = await Property.findOne({
        where: {
          id: prop_id,
          add_user_id: uid
        }
      });
  
      if (!property) {
        return res.status(401).json({
          ResponseCode: "401",
          Result: "false",
          ResponseMsg: "Property not found or you're not the owner!"
        });
      }
  
      // Check if the record exists
      const extraRecord = await TblExtra.findOne({
        where: {
          id: record_id,
          pid: prop_id,
          add_user_id: uid
        }
      });
  
      if (!extraRecord) {
        return res.status(401).json({
          ResponseCode: "401",
          Result: "false",
          ResponseMsg: "Extra Image record not found!"
        });
      }
  
      // Handle image upload or base64 decoding
      let imagePath = null;
      if (img !== '0') {
        const imgBuffer = Buffer.from(img.replace(/^data:image\/png;base64,/, '').replace(/\s/g, '+'), 'base64');
        const imageFileName = `${Date.now()}.png`;
        const uploadPath = path.join(__dirname, '../public/images/property', imageFileName);
  
        // Save image to the server
        fs.writeFileSync(uploadPath, imgBuffer);
        imagePath = `/images/property/${imageFileName}`;
      }
  
      // Update the record in tbl_extra
      const updatedData = {
        status,
        pano: is_panorama,
        img: imagePath || extraRecord.img // Keep the original image if no new image is provided
      };
  
      await TblExtra.update(updatedData, {
        where: { id: record_id }
      });
  
      res.status(200).json({
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Extra Image updated successfully!"
      });
    } catch (error) {
      console.error('Error in addEditExtraImg:', error);
      res.status(500).json({
        ResponseCode: "500",
        Result: "false",
        ResponseMsg: "Internal server error!"
      });
    }
  };

module.exports={getAllExtraImg ,addEditExtraImg }  