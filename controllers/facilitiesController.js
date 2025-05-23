const { count } = require("console");
const TblFacility = require("../models/TblFacility");
const fs = require("fs");
const path = require("path");
const uploadToS3 = require("../config/fileUpload.aws");

// Create or Update Facility
const upsertFacility = async (req, res) => {
  const { id, title, status } = req.body;
  let imgUrl;
  if(req.file){
    imgUrl=await uploadToS3(req.file ,"Facility")
  }
  try {
    if (id) {
      // Update facility
      const facility = await TblFacility.findByPk(id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
  
      facility.title = title;
      facility.status = status;
      facility.img = imgUrl || facility.img;
  
      await facility.save();
      res.status(200).json({ message: "Facility updated successfully", facility });
    } else {
      // Create new facility
      const facility = await TblFacility.create({
        title,
        status,
        img:imgUrl,
      });
      res.status(201).json({ message: "Facility created successfully", facility });
    }
  } catch (error) {
    console.error("Error in facility upsert:", error); // Add this line for more details
    res.status(500).json({ error: "Internal server error", details: error.message });
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
const getAllFacilitiesbystatus = async (req, res) => {
  try {
    const facilities = await TblFacility.findAll({where :{status:1},attributes: ["id", "title", "img"],});
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

// Get Facility Count
const getFacilityCount = async (req, res) => {
  try {
    const facilityCount = await TblFacility.count();
    res.status(200).json({ count: facilityCount });
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

const getAllFss = async (req, res) => {
  try {
    // Log the incoming search query to check if it's passed correctly
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : ""; // Make it lowercase for case-insensitive search
    console.log("Search Query:", searchQuery); // Debugging line to log the search query

    // If a search term is provided, filter results where the title contains the search query
    const facilities = await Facility.findAll({
      where: searchQuery
        ? {
            title: {
              [Op.like]: `%${searchQuery}%`, // Case-insensitive search by title
            },
          }
        : {}, // If no search query, return all records
      order: [["createdAt", "DESC"]], // Order by createdAt in descending order
    });

    console.log("Filtered Facilities:", facilities); // Debugging line to check the filtered results
    res.status(200).json(facilities); // Return the filtered facilities
  } catch (error) {
    console.error("Error fetching facilities:", error);
    res.status(500).json({ message: "Error fetching facilities", error }); // Error handling
  }
};

const toggleFacilityStatus = async (req, res) => {
  const { id, field, value } = req.body;
  try {
    if (!id || !field || value === undefined) {
      return res.status(400).json({ message: "Invalid request payload." });
    }
    console.log("Updating facility field:", { id, field, value });
    if (!["status"].includes(field)) {
      console.error(`Invalid field: ${field}`);
      return res.status(400).json({ message: "Invalid field for update." });
    }
    const facility = await TblFacility.findByPk(id);
    if (!facility) {
      console.error(`facility with ID ${id} not found`);
      return res.status(404).json({ message: "facility not found." });
    }
    facility[field] = value;
    await facility.save();
    console.log("Facility status updated", facility);
    console.log(await TblFacility.findAll());
    res.status(200).json({
      message: `${field} updated successfully.`,
      updatedField: field,
      updatedValue: value,
      facility,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllFss,
  upsertFacility,
  getAllFacilities,
  getFacilityById,
  deleteFacility,
  getFacilityCount,
  toggleFacilityStatus,
  getAllFacilitiesbystatus
};
