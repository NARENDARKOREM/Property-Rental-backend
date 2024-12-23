const TblExtra = require("../models/TblExtra");
const Property = require("../models/Property");
const { Op } = require("sequelize");
const upload = require("../config/multer");
const AWS = require("aws-sdk");
const dotEnv = require("dotenv");
const TblExtraImage = require("../models/TableExtraImages");
dotEnv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const addExtraImages = async (req, res) => {
  const { status, prop_id, uid, is_panorama } = req.body;
  const images = req.files;
  // Validate required fields
  if (
    !status ||
    !prop_id ||
    !uid ||
    !is_panorama ||
    !images ||
    images.length === 0
  ) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Missing Required Fields!",
    });
  }

  try {
    const newExtra = await TblExtra.create({
      pid: prop_id,
      status: status,
      add_user_id: uid,
    });

    const uploadedImages = [];

    for (const img of images) {
      const key = `property/${Date.now()}-${img.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: img.buffer,
        ContentType: img.mimetype,
      };

      const { Location } = await s3.upload(params).promise();
      uploadedImages.push(Location);
    }

    const newImageEntries = uploadedImages.map((url) => ({
      extra_id: newExtra.id,
      status,
      prop_id,
      uid,
      is_panorama,
      url,
    }));

    await TblExtraImage.bulkCreate(newImageEntries);

    res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Extra Images Added Successfully",
      uploadedImages,
    });
  } catch (err) {
    console.error("Error uploading images to S3:", err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Failed to Upload Images",
    });
  }
};

// Controller to edit extra images for a specific TblExtra entry
const editExtraImages = async (req, res) => {
  const { extra_id } = req.params; // Extract extra_id from request parameters
  const { status, prop_id, uid, is_panorama } = req.body;
  const images = req.files; // Extract multiple files from form-data

  // Validate required fields
  if (
    !extra_id ||
    !status ||
    !prop_id ||
    !uid ||
    !is_panorama ||
    !images ||
    images.length === 0
  ) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Missing Required Fields!",
    });
  }

  try {
    // Find the extra entry for the given extra_id
    const extra = await TblExtra.findByPk(extra_id);
    if (!extra) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Extra entry not found",
      });
    }

    // Update the extra entry properties
    extra.status = status;
    extra.pid = prop_id;
    extra.add_user_id = uid;
    await extra.save();

    // Delete existing images associated with the extra_id
    await TblExtraImage.destroy({ where: { extra_id } });

    // Upload new images and save them to the database
    const uploadedImages = [];
    for (const img of images) {
      const key = `property/${Date.now()}-${img.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: img.buffer,
        ContentType: img.mimetype,
      };

      const { Location } = await s3.upload(params).promise();
      uploadedImages.push(Location);
    }

    const newImageEntries = uploadedImages.map((url) => ({
      extra_id,
      status,
      prop_id,
      uid,
      is_panorama,
      url,
    }));

    await TblExtraImage.bulkCreate(newImageEntries);

    res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Extra Images Updated Successfully",
      uploadedImages,
    });
  } catch (err) {
    console.error("Error updating extra images:", err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Failed to Update Images",
    });
  }
};

// Controller to get all extra images for a specific user (based on uid)
const getExtraImages = async (req, res) => {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong! UID is missing",
    });
  }

  try {
    const extras = await TblExtra.findAll({
      where: { add_user_id: uid },
      include: [
        {
          model: Property,
          as: "properties", // Use the alias defined in the association
          attributes: ["title"], // Fetch the title attribute from Property
        },
        {
          model: TblExtraImage,
          as: "images",
          attributes: ["url"],
        },
      ],
    });

    if (!extras || extras.length === 0) {
      return res.status(200).json({
        extralist: [],
        ResponseCode: "200",
        Result: "false",
        ResponseMsg: "Extra Image List Not Founded!",
      });
    }

    const extraImages = extras.map((extra) => {
      return {
        id: extra.id,
        property_title: extra.property ? extra.property.title : null,
        property_id: extra.pid,
        image: extra.images,
        status: extra.status,
      };
    });

    res.status(200).json({
      extralist: extraImages,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Extra Image List Founded!",
    });
  } catch (err) {
    console.error("Error fetching extra images:", err);
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Failed to Retrieve Images",
    });
  }
};

module.exports = { editExtraImages, addExtraImages, getExtraImages };
