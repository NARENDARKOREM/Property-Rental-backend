const TblCountry = require('../models/TblCountry');

// Create Country
const createCountry = async (req, res) => {
    const { title, img, status, d_con } = req.body;

    try {
        const newCountry = await TblCountry.create({ title, img, status, d_con });
        res.status(201).json({ message: 'Country created successfully', country: newCountry });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get All Countries
const getAllCountries = async (req, res) => {
    try {
        const countries = await TblCountry.findAll();
        res.status(200).json(countries);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Country By ID
const getCountryById = async (req, res) => {
    const { id } = req.params;

    try {
        const country = await TblCountry.findByPk(id);
        if (!country) {
            return res.status(404).json({ error: 'Country not found' });
        }
        res.status(200).json(country);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update Country
const updateCountry = async (req, res) => {
    const { id } = req.params;
    const { title, img, status, d_con } = req.body;

    try {
        const country = await TblCountry.findByPk(id);
        if (!country) {
            return res.status(404).json({ error: 'Country not found' });
        }

        country.title = title || country.title;
        country.img = img || country.img;
        country.status = status !== undefined ? status : country.status;
        country.d_con = d_con !== undefined ? d_con : country.d_con;

        await country.save();

        res.status(200).json({ message: 'Country updated successfully', country });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Country
const deleteCountry = async (req, res) => {
    const { id } = req.params;
    const { forceDelete } = req.query;

    try {
        const country = await TblCountry.findOne({ where: { id }, paranoid: false });
        if (!country) {
            return res.status(404).json({ error: 'Country not found' });
        }

        if (country.deletedAt && forceDelete !== 'true') {
            return res.status(400).json({ error: 'Country is already soft-deleted' });
        }

        if (forceDelete === 'true') {
            await country.destroy({ force: true });
            res.status(200).json({ message: 'Country permanently deleted successfully' });
        } else {
            await country.destroy();
            res.status(200).json({ message: 'Country soft-deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    createCountry,
    getAllCountries,
    getCountryById,
    updateCountry,
    deleteCountry,
};
