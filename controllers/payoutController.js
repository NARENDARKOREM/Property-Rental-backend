const { Op } = require('sequelize');
const PayoutSetting = require('../models/PayoutSetting');
const Property = require('../models/Property');
const User = require('../models/User');

// Fetch Current User's Payout Settings
const getPayoutSettingsByUser = async (req, res) => {
  const owner_id = req.user.id; // Get the user ID from the authenticated user
  try {
    const payoutSettings = await PayoutSetting.findAll({ where: { owner_id } });
    res.status(200).json(payoutSettings);
  } catch (error) {
    console.error("Error in getPayoutSettingsByUser: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Upsert Payout Setting
const upsertPayoutSetting = async (req, res) => {
  const { id, property_id, proof, r_date, r_type, acc_number, bank_name, acc_name, ifsc_code, upi_id, paypal_id } = req.body;
  const owner_id = req.user.id; // Get the user ID from the authenticated user

  try {
    // Fetch property details
    const property = await Property.findByPk(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (id) {
      // Update payout setting
      const payoutSetting = await PayoutSetting.findByPk(id);
      if (!payoutSetting) {
        return res.status(404).json({ error: 'Payout setting not found' });
      }

      payoutSetting.owner_id = owner_id;
      payoutSetting.amt = property.price; // Use property price as amount
      payoutSetting.status = property.status; // Use property status
      payoutSetting.proof = proof;
      payoutSetting.r_date = r_date;
      payoutSetting.r_type = r_type;
      payoutSetting.acc_number = acc_number;
      payoutSetting.bank_name = bank_name;
      payoutSetting.acc_name = acc_name;
      payoutSetting.ifsc_code = ifsc_code;
      payoutSetting.upi_id = upi_id;
      payoutSetting.paypal_id = paypal_id;

      await payoutSetting.save();
      res.status(200).json({ message: 'Payout setting updated successfully', payoutSetting });
    } else {
      // Create new payout setting
      const payoutSetting = await PayoutSetting.create({
        owner_id,
        amt: property.price, // Use property price as amount
        status: property.status, // Use property status
        proof,
        r_date,
        r_type,
        acc_number,
        bank_name,
        acc_name,
        ifsc_code,
        upi_id,
        paypal_id
      });
      res.status(201).json({ message: 'Payout setting created successfully', payoutSetting });
    }
  } catch (error) {
    console.error("Error in upsertPayoutSetting: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// get all
const getAllPayoutList=async(req,res)=>{
  try {
    const payoutSettings = await PayoutSetting.findAll();
    res.status(200).json(payoutSettings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

module.exports = {
  getPayoutSettingsByUser,
  upsertPayoutSetting,
  getAllPayoutList
};
