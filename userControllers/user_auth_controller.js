const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Setting = require("../models/Setting");
const WalletReport = require("../models/WalletReport");
const RoleChangeRequest = require("../models/RoleChangeRequest");
const { Op } = require("sequelize");
const admin = require("../config/firebase-config");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/awss3Config");

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

const TWO_FACTOR_API_KEY = '073f2560-f66a-11ee-8cbb-0200cd936042';

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
      ResponseMsg: "All fields are required!",
    });
  }

  try {
    const existingUserByMobile = await User.findOne({ where: { mobile } });
    const existingUserByEmail = await User.findOne({ where: { email } });

    if (existingUserByMobile || existingUserByEmail) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Mobile Number or Email Address Already Used!",
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
          ResponseMsg: "Invalid Refer Code!",
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
      parentcode,
    });

    await WalletReport.create({
      uid: newUser.id,
      message: "Sign up Credit Added!!",
      status: "Credit",
      amt: walletCredit,
      tdate: timestamp,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      UserLogin: newUser,
      token,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Sign Up Done Successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
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
      ResponseMsg: "All fields are required!",
    });
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ mobile }, { email: mobile }],
        ccode,
        status: 1,
      },
    });

    if (!user) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Invalid Mobile Number, Email, or Password!",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Invalid Mobile Number, Email, or Password!",
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
      ResponseMsg: "Login Successfully!",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
      details: error.message,
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
    return res
      .status(400)
      .json({ message: "User ID and device token are required." });
  }

  try {
    const newRequest = {
      user_id: userId,
      requested_role,
      status: "pending",
    };

    const message = {
      notification: {
        title: 'Role Change Request',
        body: `User ${userId} requested to change role to ${requested_role}`
      },
      token: deviceToken
    };

    await admin.messaging().send(message);

    const roleChangeRequest = await RoleChangeRequest.create(newRequest);

    res.status(201).json({ 
      message: "Role change request submitted successfully.",
      request: roleChangeRequest, 
    });

  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to process role change request." });
  }
}

const googleAuth = async (req, res) => {
  const { name, email, refercode, pro_pic } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      ResponseCode: "400",
      Result: "false",
      ResponseMsg: "All fields are required!",
    });
  }

  try {
    
    const existingUserByEmail = await User.findOne({ where: { email } });

    if (existingUserByEmail) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "Email Address Already Used!",
      });
    }

    // Validate refer code if provided
    let parentcode = null;
    if (refercode) {
      const referredUser = await User.findOne({ where: { refercode } });
      if (referredUser) {
        parentcode = refercode;
      } else {
        return res.status(400).json({
          ResponseCode: "400",
          Result: "false",
          ResponseMsg: "Invalid Refer Code!",
        });
      }
    }

    // Generate a random refer code
    const timestamp = new Date();
    const refercodeGenerated = generateRandom();

    // Create a new user
    const newUser = await User.create({
      name,
      email,
      pro_pic,
      reg_date: timestamp,
      refercode: refercodeGenerated,
      parentcode,
      password: "0",
    });

    // Generate a token for the user
    const token = generateToken(newUser);
    return res.status(201).json({
      UserLogin: newUser,
      token,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Sign Up Done Successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};


const otpLogin = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Uncomment the following if using an actual OTP service
    // const response = await axios.get(
    //   `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/${otp}`
    // );

    // Simulate OTP sending success
    // if (response.data.Status !== 'Success') {
    //   return res.status(500).json({ message: 'Failed to send OTP.' });
    // }
    const timestamp = new Date();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 
    const [user, created] = await User.findOrCreate({
      where: { mobile },
      defaults: { mobile, otp, otpExpiresAt,reg_date:timestamp  },
    });

    if (!created) {
      
      await user.update({ otp, otpExpiresAt });
    }

    res.status(200).json({ message: 'OTP sent successfully.', otp }); // Remove `otp` in production
  } catch (error) {
    console.error('Error in otpLogin:', error.message);
    res.status(500).json({ message: 'Error sending OTP.', error: error.message });
  }
};



const verifyOtp =  async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ message: 'mobile and OTP are required.' });
  }

  try {
    
    const user = await User.findOne({ where: { mobile } });
    

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }   
    if (user.otp !== otp || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    await user.update({ otp: null, otpExpiresAt: null });

    res.status(200).json({ message: 'OTP verified successfully.', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying OTP.' });
  }
}


async function forgotPassword(req, res) {
  const { mobile, password, ccode } = req.body;

  if (!mobile || !password || !ccode) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something went wrong. Try again!",
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
        ResponseCode: "200",
        Result: "true",
        ResponseMsg: "Password Changed Successfully!",
      });
    } else {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Mobile Not Matched!",
      });
    }
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
}

const getAllusers = async (req, res) => {
  try {
    const data = await User.findAll();
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const getUsersCount = async (req, res) => {
  try {
    const usersCount = await User.count();
    res.status(200).json({ count: usersCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, gender, email, uid } = req.body;

    
    if (!uid) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "User ID (uid) is required!",
      });
    }

    
    const user = await User.findByPk(uid); 
    if (!user) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "User not found!",
      });
    }

    
    const updateData = {};
    if (name) updateData.name = name;
    if (gender) updateData.gender = gender;
    if (email) updateData.email = email;

    
    await user.update(updateData);

    
    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "User updated successfully!",
      user, 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Failed to update user!",
      error: error.message,
    });
  }
};


const deleteUser = async (req, res) => {
  const { id } = req.params; // Get user ID from request parameters
  const { forceDelete } = req.query; // Check query parameter for hard delete

  try {
    const user = await User.findOne({
      where: { id },
      paranoid: forceDelete !== "true",
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ error: "User is already soft-deleted" });
    }

    if (forceDelete === "true") {
      // Perform hard delete
      await user.destroy({ force: true });
      return res
        .status(200)
        .json({ message: "User permanently deleted successfully" });
    } else {
      // Perform soft delete (sets `deletedAt` timestamp)
      await user.destroy();
      return res
        .status(200)
        .json({ message: "User soft-deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

const handleToggle = async (req, res) => {
  const { id, field, value } = req.body;

  try {
    if (!["status", "is_subscribe"].includes(field)) {
      return res.status(400).json({ message: "Invalid field for update." });
    }
    const user = await User.findByPk(id);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found." });
    }
    user[field] = value;
    await user.save();
    console.log("User status updated", user);
    res.status(200).json({
      message: `${field} updated successfully.`,
      updatedField: field,
      updatedValue: value,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const uploadUserImage = async (req, res) => {

  try {

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
    };

    const command = new PutObjectCommand(params);
    const result = await s3.send(command);
      const imageUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;

console.log(imageUrl, "image uploaded");

    const user = await User.findByPk(3);
    // const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "User not found!",
      });
    }
    
    user.pro_pic = imageUrl;
    await user.save();

    return res.status(200).json({
      userDetails: user,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Profile Image Uploaded Successfully!!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
}

module.exports = {
  userRegister,
  userLogin,
  requestRoleChange,
  forgotPassword,
  getAllusers,
  getUsersCount,
  updateUser,
  deleteUser,
  googleAuth,
  handleToggle,
  otpLogin,
  verifyOtp,
  uploadUserImage,
};
