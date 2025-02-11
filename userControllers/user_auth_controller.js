const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Setting = require("../models/Setting");
const WalletReport = require("../models/WalletReport");
const RoleChangeRequest = require("../models/RoleChangeRequest");
const { Op, NOW } = require("sequelize");
const admin = require("../config/firebase-config");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/awss3Config");
const { TblCountry } = require("../models");
const firebaseAdmin = require("../config/firebase-config");
const { now } = require("sequelize/lib/utils");

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

const TWO_FACTOR_API_KEY = "073f2560-f66a-11ee-8cbb-0200cd936042";

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
  const userId = req.user?.id;
  const { requested_role, id_proof } = req.body;

  // Validate input
  if (!userId) {
    return res.status(400).json({ message: "User not found!" });
  }
  if (!requested_role || !["guest", "host"].includes(requested_role)) {
    return res.status(400).json({ message: "Invalid role requested." });
  }

  try {
    // Fetch user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (user.role === requested_role) {
      return res
        .status(400)
        .json({ message: "User already has the requested role." });
    }

    let imageUrl = null;

    // Handle ID proof upload for host role
    if (requested_role === "host") {
      if (!req.file) {
        return res.status(400).json({ message: "ID proof image is required." });
      }

      try {
        const s3Params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `uploads/${Date.now()}-${req.file.originalname}`,
          Body: req.file.buffer,
        };
        const command = new PutObjectCommand(s3Params);
        await s3.send(command);
        imageUrl = `https://${s3Params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;
      } catch (uploadError) {
        console.error("Error uploading to S3:", uploadError);
        return res
          .status(500)
          .json({ message: "Failed to upload ID proof image." });
      }
    }

    const existingPendingRequest = await RoleChangeRequest.findOne({
      where: { user_id: userId, status: "pending" },
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        message: "You already have a pending role change request.",
        request: existingPendingRequest,
      });
    }

    // Check for existing role change requests
    const existingRequest = await RoleChangeRequest.findOne({
      where: { user_id: userId },
    });

    if (existingRequest) {
      // Update existing request
      existingRequest.requested_role = requested_role;
      existingRequest.status = "pending";
      existingRequest.id_proof = id_proof || existingRequest.id_proof;
      if (imageUrl) {
        existingRequest.id_proof_img = imageUrl;
      }
      await existingRequest.save();

      return res.status(200).json({
        message: "Role change request updated successfully.",
        request: existingRequest,
      });
    } else {
      // Create new role change request
      const newRequest = await RoleChangeRequest.create({
        user_id: userId,
        requested_role,
        id_proof,
        id_proof_img: imageUrl,
        status: "pending",
      });

      return res.status(201).json({
        message: "Role change request created successfully.",
        request: newRequest,
      });
    }
  } catch (error) {
    console.error("Error processing role change request:", error);

    return res
      .status(500)
      .json({ message: "Failed to process role change request." });
  }
}

const googleAuth = async (req, res) => {
  try {
    const { name, email, pro_pic } = req.body;

    if (!name || !email || !pro_pic) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "All fields are required!",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create a new user if not found
      user = await User.create({
        name,
        email,
        pro_pic,
        reg_date: new Date(),
      });

      responseMessage = "Account Created Successfully!";
      responseCode = "201";
    } else {
      responseMessage = "Login Successfully!";
      responseCode = "200";
    }

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      user,
      token,
      ResponseCode: responseCode,
      Result: "true",
      message: responseMessage,
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      message: error.message || "Internal Server Error",
    });
  }
};

const otpLogin = async (req, res) => {
  const { ccode, mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }

  if (!ccode) {
    return res.status(400).json({ message: "Country code is required." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Uncomment the following if using an actual OTP service
    // const response = await axios.get(
    //   `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/${otp}`
    // );

    // if (response.data.Status !== "Success") {
    //   return res.status(500).json({ message: "Failed to send OTP." });
    // }
    const timestamp = new Date();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const [user, created] = await User.findOrCreate({
      where: { mobile, ccode },
      defaults: { mobile, otp, otpExpiresAt, reg_date: timestamp },
    });

    if (!created) {
      await user.update({ otp, otpExpiresAt });
    }

    await user.update({ status: 1 });
    res.status(200).json({ message: "OTP sent successfully.", otp });
  } catch (error) {
    console.error("Error in otpLogin:", error.message);
    res
      .status(500)
      .json({ message: "Error sending OTP.", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { mobile, otp, ccode } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required." });
  }
  if (!otp) {
    return res.status(400).json({ message: "OTP is required." });
  }
  if (!ccode) {
    return res.status(400).json({ message: "Country code is required." });
  }

  try {
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.otp !== otp || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    const token = jwt.sign(
      { userId: user.id, mobile: user.mobile },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await user.update({ status: 1, otp: null, otpExpiresAt: null });

    res.status(200).json({
      message: "OTP verified successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        ccode: user.ccode,
        role: user.role,
        country_id: user.country_id,
        pro_pic: user.pro_pic,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying OTP." });
  }
};

const loginWithMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    const validateMobile = (mobile) => {
      const regex = /^[0-9]{10}$/;
      return regex.test(mobile);
    };

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required." });
    }

    if (!validateMobile(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number." });
    }

    const newUser = await User.create({
      mobile,
      reg_date: new Date(),
    });

    const token = jwt.sign(
      { userId: newUser.id, mobile: newUser.mobile },
      process.env.JWT_SECRET
    );
    return res.status(201).json({
      message: "Sign-up successful.",
      user: {
        mobile: newUser.mobile,
        token,
      },
    });
  } catch (error) {
    console.error("Error signing up:", error);
    return res.status(500).json({ message: "Error signing up." });
  }
};

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
    const uid = req.user.id;

    if (!uid) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "User ID (uid) is required!",
      });
    }

    if (req.user.id !== parseInt(uid, 10)) {
      return res.status(403).json({
        ResponseCode: "403",
        Result: "false",
        ResponseMsg: "You are not authorized to update this user's details!",
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

    const { name, gender, email, ccode, country_id, mobile,languages } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (email !== undefined) updateData.email = email;
    if (ccode !== undefined) updateData.ccode = ccode;
    if (country_id !== undefined) updateData.country_id = country_id;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (languages !== undefined) updateData.languages = languages;

    // Fetch country and currency details if country_id is updated
    if (country_id) {
      const countryData = await TblCountry.findOne({
        where: { id: country_id, status: 1 }, // Match country ID
      });

      if (!countryData) {
        return res.status(404).json({
          ResponseCode: "404",
          Result: "false",
          ResponseMsg: "Selected country is not valid or inactive!",
        });
      }

      updateData.currency = countryData.currency; // Update currency based on the country
    }

    // Update user with new data
    await user.update(updateData);

    // Fetch the list of available countries for response
    const availableCountries = await TblCountry.findAll({
      where: { status: 1 },
      attributes: ["id", "title", "currency"], // Fetch id, title, and currency
    });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "User updated successfully!",
      user,
      availableCountries, // Send country list in response
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
  const { id } = req.params;
  const { forceDelete } = req.query;

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

const deleteUserAccount = async (req, res) => {
  const uid = req.user.id;

  if (!uid) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "User not found!",
    });
  }

  try {
    const user = await User.findByPk(uid);

    if (!user) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    await user.update({ status: 0 });

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Account Deleted Successfully!",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

const updateOneSignalSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { one_subscription } = req.body;

    // Validate required fields
    if (!one_subscription) {
      return res.status(400).json({
        error: "OneSignal subscription ID is required.",
      });
    }

    // Fetch user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    await user.update({ one_subscription });

    return res.status(200).json({
      message: "OneSignal subscription ID successfully updated.",
    });
  } catch (error) {
    console.error("Error updating OneSignal subscription:", error);
    return res.status(500).json({
      error: "Internal Server Error. Please try again later.",
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
    // Validate user authorization
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Unauthorized user!",
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        ResponseCode: "400",
        Result: "false",
        ResponseMsg: "No file uploaded!",
      });
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
    };

    console.log("Uploading to S3 with params:", params);

    // Upload to S3
    const command = new PutObjectCommand(params);
    const result = await s3.send(command);

    const imageUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    console.log("Image uploaded to S3:", imageUrl);

    // Update user profile
    const user = await User.findByPk(req.user.id);
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
    console.error("Error uploading user image:", error.message, error.stack);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const getUserData = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    res.status(400).json({ message: "User Not Found!" });
  }
  try {
    const user = await User.findByPk(uid, {
      include: [
        {
          model: RoleChangeRequest,
          as: "roleChangeRequests",
          attributes: ["status"],
        },
      ],
    });
    if (!user) {
      res.status(401).json({ message: "User Not Found!" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error Occurs While Fetching User Details: ", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const removeOneSignalId = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({ message: "User not found!" });
  }
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (!user.one_subscription) {
      return res.status(400).json({ message: "OneSignal ID not found." });
    }
    await user.update({ one_subscription: null });
    return res
      .status(200)
      .json({ message: "OneSignal ID removed successfully." });
  } catch (error) {
    console.error("Error removing OneSignal ID:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const verifyEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email);

    res.status(200).json({
      success: true,
      message: "Email is verified and exists.",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName,
      },
    });

    firebaseAdmin
      .auth()
      .listUsers(1)
      .then((userRecords) => {
        console.log("Firebase is connected:", userRecords.users.length);
      })
      .catch((error) => {
        console.error("Firebase Connection Error:", error);
      });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      res.status(404).json({
        success: false,
        message: "Email does not exist in the database.",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "An error occurred while verifying the email.",
        error: error.message,
      });
    }
  }
};

const verifyMobileNumber = async (req, res) => {
  const { mobile, ccode } = req.body;

  try {
    const existingUserByMobile = await User.findOne({ where: { mobile } });
    if (existingUserByMobile) {
      const token = generateToken(existingUserByMobile);
      return res.status(200).json({
        user: existingUserByMobile,
        token,
        ResponseCode: "200",
        Result: "true",
        message: "Login Successfully!",
      });
    }
    const newUser = await User.create({
      ccode,
      mobile,
      reg_date: new Date()
    })
    const token = generateToken(existingUserByMobile);
    return res.status(200).json({
      user: newUser,
        token,
        ResponseCode: "200",
        Result: "true",
        message: "Login Successfully!",
    })
  } catch (error) {
    console.error("Error verifying mobile number:", error.message);
      if (error.code === "auth/user-not-found") {
          return res.status(404).json({ message: "Mobile number not found!" });
      }
      res.status(500).json({
        success: false,
        message: "Internal server error.", 
        error: error.message,
      });
    }
};

const verifyMobile = async(req,res)=>{
  const {mobile}=req.body;
  if(!mobile){
      return res.status(400).json({ message: "Mobile number is required!" });
  }
  try {
      const userRecord = await firebaseAdmin.auth().getUserByPhoneNumber(mobile)
      if (!userRecord) {
          return res.status(404).json({ message: "Mobile number not found!" });
      }
      const token = jwt.sign({uid:userRecord.uid,mobile:userRecord.phoneNumber},process.env.JWT_SECRET)
      return res.status(200).json({
          message: "Mobile number verified successfully!",
          mobile: userRecord.phoneNumber,
          token
      });
  } catch (error) {
      console.error("Error verifying mobile number:", error.message);
      if (error.code === "auth/user-not-found") {
          return res.status(404).json({ message: "Mobile number not found!" });
      }
      return res.status(500).json({ message: "Error verifying mobile number: " + error.message });
  }
}

const setLanguage = async (req, res) => {
  try {
    const uid = req.user.id;
    const { languages, language_id } = req.body;
    if (!uid) {
      return res.status(401).json({ message: "User not found!" });
    }

    if (!Array.isArray(languages) || !Array.isArray(language_id)) {
      return res.status(400).json({ message: "Languages and language_id must be arrays." });
    }
    if (languages.length !== language_id.length) {
      return res.status(400).json({ message: "languages and language_id must have the same length." });
    }

    const user = await User.findByPk(uid);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.languages = JSON.stringify(languages);
    user.language_id = JSON.stringify(language_id);

    await user.save();

    return res.status(200).json({
      message: "Languages updated successfully!",
      user: {
        id: user.id,
        languages: JSON.parse(user.languages),
        language_id: JSON.parse(user.language_id),
      },
    });
  } catch (error) {
    console.error("Error updating languages:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

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
  deleteUserAccount,
  updateOneSignalSubscription,
  getUserData,
  loginWithMobile,
  removeOneSignalId,
  verifyEmail,
  verifyMobileNumber,
  verifyMobile,
  setLanguage
};
