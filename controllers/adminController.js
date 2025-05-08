const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { Op } = require("sequelize");
const TblBook = require("../models/TblBook");
const { RoleChangeRequest, Property, User, TblExtra, PriceCalendar } = require("../models");
const TblFav = require("../models/TblFav");

// Generate JWT
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, username: admin.username, userType: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// Signup Controller
const registerAdmin = async (req, res) => {
  const { username, password, userType } = req.body;
  console.log(req.body);

  if (!userType) {
    return res.status(400).json({ error: "User type is required" });
  }

  try {
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      username,
      password,
      userType,
    });

    

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Signin Controller
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);

  try {
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // const isMatch = await bcrypt.compare(password, admin.password);
    if (admin.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const token = generateToken(admin);
    res.status(200).json({ message: "Admin signed in successfully", admin, token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update Admin Controller
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  try {
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    admin.username = username;
    admin.password = password;
    // if (password) {
    //   admin.password = await bcrypt.hash(password, 12);
    // }

    await admin.save();
    res.status(200).json({ message: "Admin updated successfully", admin });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserbyToken = async (req, res) => {
  try {
    
    const user = req.user;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Admin Controller
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const admin = await Admin.findOne({ where: { id }, paranoid: false });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (admin.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ error: "Admin is already soft-deleted" });
    }

    if (forceDelete === "true") {
      await admin.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Admin permanently deleted successfully" });
    } else {
      await admin.destroy();
      res.status(200).json({ message: "Admin soft-deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Admins Controller
const getAllAdmins = async (req, res) => {
  try {
    const adminCount = await Admin.count();
    const admins = await Admin.findAll();
    res.status(200).json({ admins, count: adminCount });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get Single Admin by ID Controller
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const singleAdmin = await Admin.findByPk(id);
    if (!singleAdmin) {
      res.status(500).json({ error: "Admin not found" });
    }
    res.status(200).json(singleAdmin);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logout Controller
const logoutAdmin = (req, res) => {
  const username = req.session.admin ? req.session.admin.username : "Admin";
  res.clearCookie("token");
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.status(200).json({ message: `${username} logged out successfully` });
  });
};

const searchAdmins = async (req, res) => {
  const { id, username, userType } = req.query;

  try {
    const whereClause = {};

    if (id) whereClause.id = id;
    if (username && username.trim()) {
      whereClause.username = { [Op.like]: `%${username}%` };
    }
    if (userType && userType.trim()) {
      whereClause.userType = { [Op.like]: `%${userType}%` };
    }

    console.log("Generated whereClause:", whereClause);

    const admins = await Admin.findAll({ where: whereClause });

    if (admins.length === 0) {
      return res.status(404).json({ error: "No matching admins found" });
    }

    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteUserByAdmin = async (req, res) => {
  const adminId = req.user.id;
  const isAdmin = req.user.userType === "admin";
  const { id } = req.params;
  const { forceDelete } = req.query;

  console.log("Admin delete user request:", { adminId, isAdmin, userId: id, forceDelete });

  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden: Only admins can perform this action" });
  }

  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.deletedAt && forceDelete !== "true") {
      return res.status(400).json({ error: "User is already soft-deleted" });
    }

    // Check if the user is a host and has any properties
    if (user.role === "host") {
      const properties = await Property.findAll({ where: { add_user_id: id } });

      for (const property of properties) {
        const confirmedBookings = await TblBook.count({
          where: {
            prop_id: property.id,
            book_status: "Confirmed",
          },
        });

        if (confirmedBookings > 0) {
          return res.status(403).json({
            error: "Cannot delete property",
            message: "Property has confirmed bookings and cannot be deleted.",
          });
        }

        await PriceCalendar.destroy({
          where: { prop_id: property.id },
          force: forceDelete === "true",
        });

        await TblBook.destroy({
          where: { prop_id: property.id },
          force: forceDelete === "true",
        });

        await TblExtra.destroy({
          where: { pid: property.id },
          force: forceDelete === "true",
        });

        await TblFav.destroy({
          where: { prop_id: property.id },
          force: forceDelete === "true",
        });

        await property.destroy({ force: forceDelete === "true" });
      }
    }

    // Check for active bookings
    const activeBookings = await TblBook.count({
      where: {
        uid: id,
        book_status: {
          [Op.in]: ["Booked", "Check_in", "Confirmed"],
        },
      },
    });

    if (activeBookings > 0) {
      return res.status(403).json({
        error: "User cannot be deleted",
        message: "User has active bookings that are not completed or blocked.",
      });
    }

    // Delete related records
    await RoleChangeRequest.destroy({ where: { user_id: id }, force: forceDelete === "true" });
    await TblBook.destroy({ where: { uid: id }, force: forceDelete === "true" });
    await TblFav.destroy({ where: { uid: id }, force: forceDelete === "true" });
    await Property.destroy({ where: { add_user_id: id }, force: forceDelete === "true" });

    // Delete the user
    if (forceDelete === "true") {
      await user.destroy({ force: true });
      return res.status(200).json({ message: "User permanently deleted successfully" });
    } else {
      await user.destroy();
      return res.status(200).json({ message: "User soft-deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  updateAdmin,
  deleteAdmin,
  getAllAdmins,
  getAdminById,
  logoutAdmin,
  getUserbyToken,
  searchAdmins,
  deleteUserByAdmin
};
