const TblExtra = require("../models/TblExtra");
const fs = require("fs");
const path = require("path");
const Property = require("../models/Property");
const TblExtraImage = require("../models/TableExtraImages");
const { fileURLToPath } = require("url");

// Create or Update Extra Image
const upsertExtra = async (req, res) => {
  const { id, pid, img, status } = req.body;
  console.log(req.body, "from body");

  const add_user_id = 1;

  try {
    if (id) {
      const extra = await TblExtra.findByPk(id, { include: "images" });
      if (!extra) {
        return res.status(404).json({ error: "Extra not found" });
      }

      Object.assign(extra, { pid, status, add_user_id });
      await extra.save();

      await TblExtraImage.destroy({ where: { extra_id: id } });

      const newImages = img.map((urls) => ({ extra_id: id, url: urls.url }));
      await TblExtraImage.bulkCreate(newImages);

      res.status(200).json({ message: "Extra updated successfully", extra });
    } else {
      const extra = await TblExtra.create({ pid, status, add_user_id });

      const newImages = img.map((urls) => ({
        extra_id: extra.id,
        url: urls.url,
      }));

      await TblExtraImage.bulkCreate(newImages);

      res.status(201).json({ message: "Extra created successfully", extra });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get All Extra Images
const getAllExtras = async (req, res) => {
  try {
    const extras = await TblExtra.findAll({
      include: [
        {
          model: TblExtraImage,
          as: "images",
          attributes: ["url"],
        },
        {
          model: Property,
          attributes: ["title"],
        },
      ],
    });

    res.status(200).json(extras);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Get Extra Images Count
const getExtraImagesCount = async (req, res) => {
  try {
    const extraImagesCount = await TblExtra.count();
    res.status(200).json({ count: extraImagesCount });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Get Single Extra Image by ID
const getExtraById = async (req, res) => {
  try {
    const { id } = req.params;
    const extras = await TblExtra.findByPk(id, {
      include: [
        {
          model: TblExtraImage,
          as: "images",
          attributes: ["url"],
        },
        {
          model: Property,
          attributes: ["title"],
        },
      ],
    });
    if (!extras) {
      return res.status(404).json({ error: "Extra image not found" });
    }
    res.status(200).json(extras);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete Extra Image
const deleteExtra = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const extra = await TblExtra.findOne({ where: { id }, paranoid: false });
    if (!extra) {
      return res.status(404).json({ error: "Extra image not found" });
    }

    if (extra.deletedAt && forceDelete !== "true") {
      return res
        .status(400)
        .json({ error: "Extra image is already soft-deleted" });
    }

    if (forceDelete === "true") {
      if (extra.img && !extra.img.startsWith("http")) {
        const imgPath = path.join(__dirname, "..", extra.img);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath); // Remove image file if it's a local path
        }
      }
      await extra.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Extra image permanently deleted successfully" });
    } else {
      await extra.destroy();
      res
        .status(200)
        .json({ message: "Extra image soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const toggleExtraImagesStatus = async (req, res) => {
  const { id, field, value } = req.body;
  try {
    if (!id || !field || !value == undefined) {
      return res.status(400).json({ message: "Invalid request payload" });
    }
    console.log("Updated Extra Images status field: ", { id, field, value });
    if (!["status"].includes(field)) {
      console.error(`Invalid field: ${field}`);
      return res.status(400).json({ message: "Invalid field for update." });
    }
    const extraImages = await TblExtra.findByPk(id);
    if (!extraImages) {
      console.error(`Property with ID ${id} not found`);
      return res.status(404).json({ message: "Image not found." });
    }
    extraImages[field] = value;
    await extraImages.save();
    console.log("Payment status updated", extraImages);
    console.log(await TblExtra.findAll());
    res.status(200).json({
      message: `${field} updated successfully.`,
      updatedField: field,
      updatedValue: value,
      extraImages,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  upsertExtra,
  getAllExtras,
  getExtraById,
  deleteExtra,
  getExtraImagesCount,
  toggleExtraImagesStatus,
};
