const TblGalCat = require('../models/TblGalCat');
const Property = require('../models/Property');
const jwt = require("jsonwebtoken");
// Create or Update Gallery Category
const upsertGalCat = async (req, res) => {
    try {
        const { id, pid, title, status } = req.body;
        console.log(req.body)
        const token = req.cookies.token;
        // console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const add_user_id = decoded.id;
        // console.log(decoded)
        if (id) {
            const galCat = await TblGalCat.findByPk(id);
            if (!galCat) {
                return res.status(404).json({ error: 'Gallery category not found' });
            }

            Object.assign(galCat, { pid, title, status, add_user_id });
            await galCat.save();
            res.status(200).json({ message: 'Gallery category updated successfully', galCat });
        } else {
            const galCat = await TblGalCat.create({ pid, title, status, add_user_id });
            res.status(201).json({ message: 'Gallery category created successfully', galCat });
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get All Gallery Categories
const getAllGalCats = async (req, res) => {
    try {
        const galCats = await TblGalCat.findAll();
        res.status(200).json(galCats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Single Gallery Category by ID
const getGalCatById = async (req, res) => {
    try {
        const { id } = req.params;
        const galCat = await TblGalCat.findByPk(id);
        if (!galCat) {
            return res.status(404).json({ error: 'Gallery category not found' });
        }
        res.status(200).json(galCat);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Gallery Category
const deleteGalCat = async (req, res) => {
    const { id } = req.params;
    const { forceDelete } = req.query;

    try {
        const galCat = await TblGalCat.findOne({ where: { id }, paranoid: false });
        if (!galCat) {
            return res.status(404).json({ error: 'Gallery category not found' });
        }

        if (galCat.deletedAt && forceDelete !== 'true') {
            return res.status(400).json({ error: 'Gallery category is already soft-deleted' });
        }

        if (forceDelete === 'true') {
            await galCat.destroy({ force: true });
            res.status(200).json({ message: 'Gallery category permanently deleted successfully' });
        } else {
            await galCat.destroy();
            res.status(200).json({ message: 'Gallery category soft-deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    upsertGalCat,
    getAllGalCats,
    getGalCatById,
    deleteGalCat
};
