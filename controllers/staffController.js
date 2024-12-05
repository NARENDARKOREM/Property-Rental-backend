const Staff = require('../models/Staff');
const { Op } = require('sequelize');

// Create or Update Staff
const upsertStaff = async (req, res) => {
    const { id, country, category, coupon, enquiry, payout, property, eimg, facility, gcat, gal, package, booking, page, faq, ulist, payment, email, password, status } = req.body;

    try {
        const data = {
            country: country ? country.join(',') : '',
            category: category ? category.join(',') : '',
            coupon: coupon ? coupon.join(',') : '',
            enquiry: enquiry ? enquiry.join(',') : '',
            payout: payout ? payout.join(',') : '',
            property: property ? property.join(',') : '',
            eimg: eimg ? eimg.join(',') : '',
            facility: facility ? facility.join(',') : '',
            gcat: gcat ? gcat.join(',') : '',
            gal: gal ? gal.join(',') : '',
            package: package ? package.join(',') : '',
            booking: booking ? booking.join(',') : '',
            page: page ? page.join(',') : '',
            faq: faq ? faq.join(',') : '',
            ulist: ulist ? ulist.join(',') : '',
            payment: payment ? payment.join(',') : '',
            email,
            password,
            status
        };

        if (id) {
            // Update Staff
            const staff = await Staff.findByPk(id);
            if (!staff) {
                return res.status(404).json({ error: 'Staff not found' });
            }

            await staff.update(data);
            res.status(200).json({ message: 'Staff updated successfully', staff });
        } else {
            // Create new Staff
            const staff = await Staff.create(data);
            res.status(201).json({ message: 'Staff created successfully', staff });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get All Staff
const getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.findAll();
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get Single Staff by ID
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff.findByPk(id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete Staff
const deleteStaff = async (req, res) => {
    const { id } = req.params;
    const { forceDelete } = req.query;

    try {
        const staff = await Staff.findOne({ where: { id }, paranoid: false });
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        if (staff.deletedAt && forceDelete !== 'true') {
            return res.status(400).json({ error: 'Staff is already soft-deleted' });
        }

        if (forceDelete === 'true') {
            await staff.destroy({ force: true });
            res.status(200).json({ message: 'Staff permanently deleted successfully' });
        } else {
            await staff.destroy();
            res.status(200).json({ message: 'Staff soft-deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    upsertStaff,
    getAllStaff,
    getStaffById,
    deleteStaff
};
