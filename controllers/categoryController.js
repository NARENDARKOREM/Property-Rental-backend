const TblCategory = require("../models/TblCategory");
const fs = require("fs");
const path = require("path");

// Create or Update Category
const upsertCategory = async (req, res) => {
  const { id, title, status, img } = req.body;

  try {
    if (id) {
      // Update category
      const category = await TblCategory.findByPk(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      if (req.file && category.img && !category.img.startsWith("http")) {
        fs.unlinkSync(path.join(__dirname, "..", category.img)); // Remove old image if not a URL
      }

      category.title = title;
      category.img = img;
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
    console.log(categories)
    res.status(200).json(categories);
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
          fs.unlinkSync(path.join(__dirname, "..", category.img)); // Remove image file if it's a local path
        } catch (err) {
          console.error("Error removing file:", err); // Log the error if file removal fails
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

module.exports = {
  upsertCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
};
