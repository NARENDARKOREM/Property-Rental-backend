const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const Setting = require('../models/Setting');
const WalletReport = require('../models/WalletReport');
const RoleChangeRequest = require('../models/RoleChangeRequest');
const {Op } = require('sequelize');
const admin=require("../config/firebase-config")


function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } 
  );
}

function generateRandom() {
    const random = Math.floor(100000 + Math.random() * 900000);
    return random;
  }

// Register
async function userRegister(req, res) {
  const { name, mobile, password, ccode, email, refercode } = req.body;

  if (!name || !mobile || !password || !ccode || !email) {
    return res.status(400).json({
      ResponseCode: "400",
      Result: "false",
      ResponseMsg: "All fields are required!"
    });
  }

  try {
    const existingUserByMobile = await User.findOne({ where: { mobile } });
    const existingUserByEmail = await User.findOne({ where: { email } });

    if (existingUserByMobile || existingUserByEmail) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Mobile Number or Email Address Already Used!"
      });
    }

    let parentcode = null;
    if (refercode) {
      const referredUser = await User.findOne({ where: { refercode } });
      if (referredUser) {
        parentcode = refercode;
      } else {
        return res.status(400).json({
          ResponseCode: "400",
          Result: "false",
          ResponseMsg: "Invalid Refer Code!"
        });
      }
    }

    const timestamp = new Date();
    const refercodeGenerated = generateRandom();

    const walletSettings = await Setting.findOne();
    const walletCredit = walletSettings.scredit;

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      mobile,
      reg_date: timestamp,
      password: hashedPassword,
      ccode,
      refercode: refercodeGenerated,
      wallet: walletCredit,
      parentcode
    });

    await WalletReport.create({
      uid: newUser.id,
      message: 'Sign up Credit Added!!',
      status: 'Credit',
      amt: walletCredit,
      tdate: timestamp
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      UserLogin: newUser,
      token,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Sign Up Done Successfully!"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error"
    });
  }
}

// Login
async function userLogin(req, res) {
  const { mobile, password, ccode } = req.body;

  if (!mobile || !password || !ccode) {
    return res.status(400).json({
      ResponseCode: "400",
      Result: "false",
      ResponseMsg: "All fields are required!"
    });
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ mobile }, { email: mobile }],
        ccode,
        status: 1
      }
    });

    if (!user) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Invalid Mobile Number, Email, or Password!"
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Invalid Mobile Number, Email, or Password!"
      });
    }

    const settings = await Setting.findOne();
    const token = generateToken(user);
    console.log(token);

    return res.status(200).json({
      UserLogin: user,
      currency: settings ? settings.currency : null,
      token,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Login Successfully!"
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      details: error.message
    });
  }
}

//Role change controller

async function requestRoleChange(req, res) {
  const { requested_role, userId, deviceToken } = req.body; 

  if (!requested_role || !["guest", "host"].includes(requested_role)) {
    return res.status(400).json({ message: "Invalid role requested." });
  }
  if (!userId || !deviceToken) {
    return res.status(400).json({ message: "User ID and device token are required." });
  }

  try {
    const newRequest = {
      id: 1, 
      user_id: userId,
      requested_role,
      status: "pending",
    };

    // Send FCM notification
    const message = {
      notification: {
        title: "Role Change Request",
        body: `User ${userId} requested to change role to '${requested_role}'`,
      },
      token: deviceToken, 
    };

    await admin.messaging().send(message);

    res.status(201).json({
      message: "Role change request submitted and notification sent successfully.",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to process role change request." });
  }
}



 async function forgotPassword (req, res) {
  const { mobile, password, ccode } = req.body;
  
  if (!mobile || !password || !ccode) {
    return res.status(401).json({
      ResponseCode: '401',
      Result: 'false',
      ResponseMsg: 'Something went wrong. Try again!',
    });
  }

  try {
    const user = await User.findOne({
      where: {
        mobile: mobile.trim(),
        ccode: ccode.trim(),
      },
    });

    if (user) {
      
      await user.update({ password: password.trim() });

      return res.status(200).json({
        ResponseCode: '200',
        Result: 'true',
        ResponseMsg: 'Password Changed Successfully!',
      });
    } else {
      
      return res.status(401).json({
        ResponseCode: '401',
        Result: 'false',
        ResponseMsg: 'Mobile Not Matched!',
      });
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({
      ResponseCode: '500',
      Result: 'false',
      ResponseMsg: 'Internal Server Error',
    });
  }
}

const getAllusers=async(req, res)=>{
  try {
    const data = await User.findAll();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getUsersCount=async(req, res)=>{
  try {
    const usersCount = await User.count();

    res.status(200).json({count:usersCount});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  userRegister,
  userLogin,
  requestRoleChange,
  forgotPassword,
  getAllusers,
  getUsersCount
};
