const TblFacility = require("../models/TblFacility");
const fs = require("fs");
const path = require("path");

// Create or Update Facility
const upsertFacility = async (req, res) => {
  const { id, title, status, img } = req.body;

  try {
    if (id) {
      // Update facility
      const facility = await TblFacility.findByPk(id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (req.file && facility.img && !facility.img.startsWith("http")) {
        fs.unlinkSync(path.join(__dirname, "..", facility.img)); // Remove old image if not a URL
      }

      facility.title = title;
      facility.status = status;
      facility.img = imgPath || facility.img;

      await facility.save();
      res
        .status(200)
        .json({ message: "Facility updated successfully", facility });
    } else {
      // Create new facility
      const facility = await TblFacility.create({
        title,
        status,
        img,
      });
      res
        .status(201)
        .json({ message: "Facility created successfully", facility });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Facilities
const getAllFacilities = async (req, res) => {
  try {
    const facilities = await TblFacility.findAll();
    res.status(200).json(facilities);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Single Facility by ID
const getFacilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const facility = await TblFacility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.status(200).json(facility);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Facility
const deleteFacility = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const facility = await TblFacility.findOne({
      where: { id },
      paranoid: false,
    });
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    if (facility.deletedAt && forceDelete !== "true") {
      return res
        .status(400)
        .json({ error: "Facility is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (facility.img && !facility.img.startsWith("http")) {
        fs.unlinkSync(path.join(__dirname, "..", facility.img)); // Remove image file if it's a local path
      }
      await facility.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Facility permanently deleted successfully" });
    } else {
      await facility.destroy();
      res.status(200).json({ message: "Facility soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

module.exports = {
  upsertFacility,
  getAllFacilities,
  getFacilityById,
  deleteFacility,
};
