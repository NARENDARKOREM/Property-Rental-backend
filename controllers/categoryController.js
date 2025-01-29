const { count } = require("console");
const TblCategory = require("../models/TblCategory");
const fs = require("fs");
const path = require("path");
const uploadToS3 = require("../config/fileUpload.aws");

// Create or Update Category
const upsertCategory = async (req, res) => {
  const { id, title, status } = req.body;
  console.log(req.body)
  if(!title || !status){
    return res.status(401).json({ error: "All fields are required" });
  }

  try {
    let img;
    if (req.file) {
      img = await uploadToS3(req.file, "category");
    } 

    if (id) {
      // Update category
      const category = await TblCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      if (req.file && category.img && !category.img.startsWith("http")) {
        fs.unlinkSync(path.join(__dirname, "..", category.img));
      }

      category.title = title;
      category.img = img || category.img;
      category.status = status;

      await category.save();
      res
        .status(200)
        .json({ message: "Category updated successfully", category });
    } else {
      // Create new category
      const category = await TblCategory.create({
        title,
        img,
        status,
      });
      res
        .status(201)
        .json({ message: "Category created successfully", category });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await TblCategory.findAll();
    console.log(categories);
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Category Count
const getCategoryCount = async (req, res) => {
  try {
    const categoryCount = await TblCategory.count();
    res.status(200).json({ count: categoryCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Single Category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await TblCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const category = await TblCategory.findOne({
      where: { id },
      paranoid: false,
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (category.deletedAt && forceDelete !== "true") {
      return res
        .status(400)
        .json({ error: "Category is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (category.img && !category.img.startsWith("http")) {
        try {
          fs.unlinkSync(path.join(__dirname, "..", category.img));
        } catch (err) {
          console.error("Error removing file:", err);
        }
      }
      await category.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Category permanently deleted successfully" });
    } else {
      await category.destroy();
      res.status(200).json({ message: "Category soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const toggleCategoryStatus = async (req, res) => {
  console.log("Request received:", req.body);

  const { id, value } = req.body;

  try {
    const category = await TblCategory.findByPk(id);

    if (!category) {
      console.log("Category not found");
      return res.status(404).json({ message: "Category not found." });
    }

    category.status = value;
    await category.save();

    console.log("Category updated successfully:", category);
    res.status(200).json({
      message: "Category status updated successfully.",
      updatedStatus: category.status,
    });
  } catch (error) {
    console.error("Error updating category status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  upsertCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
  getCategoryCount,
  toggleCategoryStatus,
};
