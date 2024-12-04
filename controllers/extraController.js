const TblExtra = require('../models/TblExtra');
const fs = require('fs');
const path = require('path');

// Create or Update Extra Image
const upsertExtra = async (req, res) => {
    const { id, pid, pano, status } = req.body;
    const add_user_id = req.user.id; // Get the user ID from the authenticated user
    let imgPath = '';

    if (req.file) {
        imgPath = `uploads/${req.file.filename}`;
    } else {
        imgPath = req.body.img || '';
    }

    try {
        if (id) {
            // Update extra image
            const extra = await TblExtra.findByPk(id);
            if (!extra) {
                return res.status(404).json({ error: 'Extra image not found' });
            }

            if (req.file && extra.img && !extra.img.startsWith('http')) {
                const oldImagePath = path.join(__dirname, '..', extra.img);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath); // Remove old image if not a URL
                }
            }

            Object.assign(extra, { pid, img: imgPath || extra.img, pano, status, add_user_id });
            await extra.save();
            res.status(200).json({ message: 'Extra image updated successfully', extra });
        } else {
            // Create new extra image
            const extra = await TblExtra.create({ pid, img: imgPath, pano, status, add_user_id });
            res.status(201).json({ message: 'Extra image created successfully', extra });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get All Extra Images
const getAllExtras = async (req, res) => {
    try {
        const extras = await TblExtra.findAll();
        res.status(200).json(extras);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Single Extra Image by ID
const getExtraById = async (req, res) => {
    try {
        const { id } = req.params;
        const extra = await TblExtra.findByPk(id);
        if (!extra) {
            return res.status(404).json({ error: 'Extra image not found' });
        }
        res.status(200).json(extra);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Extra Image
const deleteExtra = async (req, res) => {
    const { id } = req.params;
    const { forceDelete } = req.query;

    try {
        const extra = await TblExtra.findOne({ where: { id }, paranoid: false });
        if (!extra) {
            return res.status(404).json({ error: 'Extra image not found' });
        }

        if (extra.deletedAt && forceDelete !== 'true') {
            return res.status(400).json({ error: 'Extra image is already soft-deleted' });
        }

        if (forceDelete === 'true') {
            if (extra.img && !extra.img.startsWith('http')) {
                const imgPath = path.join(__dirname, '..', extra.img);
                if (fs.existsSync(imgPath)) {
                    fs.unlinkSync(imgPath); // Remove image file if it's a local path
                }
            }
            await extra.destroy({ force: true });
            res.status(200).json({ message: 'Extra image permanently deleted successfully' });
        } else {
            await extra.destroy();
            res.status(200).json({ message: 'Extra image soft-deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    upsertExtra,
    getAllExtras,
    getExtraById,
    deleteExtra
};
