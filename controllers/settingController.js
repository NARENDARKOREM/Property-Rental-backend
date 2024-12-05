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
    res.status(200).json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update Setting
const updateSetting = async (req, res) => {
  const { webname, timezone, currency, tax, sms_type, auth_key, otp_id, acc_id, auth_token, twilio_number, otp_auth, show_property, one_key, one_hash, scredit, rcredit, wlimit, pdboy, show_dark } = req.body;
  let weblogo = req.body.weblogo;

  if (req.file) {
    weblogo = `uploads/${req.file.filename}`;
  }

  try {
    const setting = await Setting.findByPk(1); // Assuming there's only one setting entry
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    if (req.file && setting.weblogo && !setting.weblogo.startsWith('http')) {
      fs.unlinkSync(path.join(__dirname, '..', setting.weblogo)); // Remove old image if not a URL
    }

    await setting.update({
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
