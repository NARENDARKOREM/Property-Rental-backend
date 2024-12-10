const Setting = require('../models/Setting');
const path = require('path');
const fs = require('fs');

// Get Setting
const getSetting = async (req, res) => {
  try {
    const setting = await Setting.findByPk(1); // Assuming there's only one setting entry
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    // console.log(setting)
    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update Setting
const updateSetting = async (req, res) => {
  const id=req.params.id;
  console.log(id)
  const { webname, timezone, currency, tax, sms_type, auth_key, otp_id, acc_id, auth_token, twilio_number, otp_auth, show_property, one_key, one_hash, scredit, rcredit, wlimit, pdboy, show_dark } = req.body;
  let weblogo = req.body.weblogo;
  console.log(req.body)
  

  try {
    const setting = await Setting.findByPk(id);
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    

    await setting.update({
      id,
      webname,
      weblogo,
      timezone,
      currency,
      tax,
      sms_type,
      auth_key,
      otp_id,
      acc_id,
      auth_token,
      twilio_number,
      otp_auth,
      show_property,
      one_key,
      one_hash,
      scredit,
      rcredit,
      wlimit,
      pdboy,
      show_dark
    });

    res.status(200).json({ message: 'Setting updated successfully', setting });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getSetting,
  updateSetting
};
