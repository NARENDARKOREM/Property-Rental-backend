const { count } = require("console");
const TblPackage = require("../models/TblPackage");
const fs = require("fs");
const path = require("path");
const { Property } = require("../models");

// Create or Update Package
const upsertPackage = async (req, res) => {
  const { id, title, day, price, description, status, img } = req.body;
  console.log(req.body);
  try {
    if (id) {
      // Update package
      const package = await TblPackage.findByPk(id);
      if (!package) {
        return res.status(404).json({ error: "Package not found" });
      }

      package.title = title;
      package.day = day;
      package.price = price;
      package.description = description;
      package.status = status;
      package.image = img; // Ensure the field name matches the model

      await package.save();
      res
        .status(200)
        .json({ message: "Package updated successfully", package });
    } else {
      // Create new package
      const package = await TblPackage.create({
        title,
        day,
        price,
        description,
        status,
        image: img, // Ensure the field name matches the model
      });
      res
        .status(201)
        .json({ message: "Package created successfully", package });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Packages
const getAllPackages = async (req, res) => {
  try {
    const packages = await TblPackage.findAll();
    res.status(200).json(packages);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Packages Count
const getPackagesCount = async (req, res) => {
  try {
    const packagesCount = await TblPackage.count();
    res.status(200).json({ count: packagesCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Single Package by ID
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await TblPackage.findByPk(id);
    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.status(200).json(package);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Package
const deletePackage = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const package = await TblPackage.findOne({
      where: { id },
      paranoid: false,
    });
    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }

    if (package.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ error: "Package is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (package.image && !package.image.startsWith("http")) {
        fs.unlinkSync(path.join(__dirname, "..", package.image)); // Remove image file if it's a local path
      }
      await package.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Package permanently deleted successfully" });
    } else {
      await package.destroy();
      res.status(200).json({ message: "Package soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const togglePackageStatus = async (req, res) => {
  const { id, field, value } = req.body;
  try {
    if (!id || !field || !value === undefined) {
      return res.status(400).json({ message: "Invalid request payload" });
    }
    console.log("Upadating packages field: ", { id, field, value });
    if (!["status"].includes(field)) {
      console.error(`Invalid field: ${field}`);
      return res.status(400).json({ message: "Invalid field for update." });
    }
    const package = await TblPackage.findByPk(id);
    if (!package) {
      console.error(`Package with ID ${id} not found.`);
      return res.status(404).json({ message: "Package not found. " });
    }
    package[field] = value;
    package.save();
    console.log("Package status updated", package);
    res.status(200).json({
      message: `${field} updated successfully. `,
      updatedField: field,
      updatedValue: value,
      package,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  upsertPackage,
  getAllPackages,
  getPackageById,
  deletePackage,
  getPackagesCount,
  togglePackageStatus,
};
