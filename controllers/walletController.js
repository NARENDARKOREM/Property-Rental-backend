const WalletReport = require('../models/WalletReport');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get Wallet Report
const getWalletReport = async (req, res) => {
    const uid = req.user.id; // Get the user ID from the authenticated user

    try {
        const reports = await WalletReport.findAll({ where: { uid } });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Update Wallet Balance
const updateWalletBalance = async (req, res) => {
    const { uid, amount, status, message } = req.body;
    const tdate = new Date();

    try {
        // Find the user by ID
        const user = await User.findByPk(uid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's wallet balance
        if (status === 'Credit') {
            user.wallet += amount;
        } else if (status === 'Debit') {
            if (user.wallet < amount) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            user.wallet -= amount;
        } else {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await user.save();

        // Create a wallet report entry
        const walletReport = await WalletReport.create({
            uid,
            message,
            status,
            amt: amount,
            tdate
        });

        res.status(200).json({ message: 'Wallet balance updated successfully', walletReport });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    getWalletReport,
    updateWalletBalance
};
