const TblGallery = require("../models/TblGallery");
const fs = require("fs");
const path = require("path");

// Create or Update Gallery
const upsertGallery = async (req, res) => {
  const { id, pid, cat_id, status } = req.body;
  const add_user_id = req.user.id; // Get the user ID from the authenticated user

  try {
    if (id) {
      // Update gallery
      const gallery = await TblGallery.findByPk(id);
      if (!gallery) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      if (req.file && gallery.img && !gallery.img.startsWith("http")) {
        const oldImagePath = path.join(__dirname, "..", gallery.img);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Remove old image if not a URL
        }
      }

      Object.assign(gallery, { pid, cat_id, img, status, add_user_id });
      await gallery.save();
      res
        .status(200)
        .json({ message: "Gallery updated successfully", gallery });
    } else {
      // Create new gallery
      const gallery = await TblGallery.create({
        pid,
        cat_id,
        img,
        status,
        add_user_id,
      });
      res
        .status(201)
        .json({ message: "Gallery created successfully", gallery });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Galleries
const getAllGalleries = async (req, res) => {
  try {
    const galleries = await TblGallery.findAll();
    res.status(200).json(galleries);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get Single Gallery by ID
const getGalleryById = async (req, res) => {
  try {
    const { id } = req.params;
    const gallery = await TblGallery.findByPk(id);
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }
    res.status(200).json(gallery);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Gallery
const deleteGallery = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const gallery = await TblGallery.findOne({
      where: { id },
      paranoid: false,
    });
    if (!gallery) {
      return res.status(404).json({ error: "Gallery not found" });
    }

    if (gallery.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ error: "Gallery is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (gallery.img && !gallery.img.startsWith("http")) {
        const imgPath = path.join(__dirname, "..", gallery.img);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath); // Remove image file if it's a local path
        }
      }
      await gallery.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Gallery permanently deleted successfully" });
    } else {
      await gallery.destroy();
      res.status(200).json({ message: "Gallery soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

module.exports = {
  upsertGallery,
  getAllGalleries,
  getGalleryById,
  deleteGallery,
};
