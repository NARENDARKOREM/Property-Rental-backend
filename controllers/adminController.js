const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Generate JWT
const generateToken = (admin) => {
  return jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Signup Controller
const registerAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      username,
      password: hashedPassword
    });

    const token = generateToken(admin);

    res.cookie("token", token, { httpOnly: true });

    req.session.admin = admin;

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Signin Controller
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = generateToken(admin);

    res.cookie("token", token, { httpOnly: true });

    req.session.admin = admin;

    res.status(200).json({ message: "Admin signed in successfully", admin });
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
    if (password) {
      admin.password = await bcrypt.hash(password, 12);
    }

    await admin.save();

    res.status(200).json({ message: "Admin updated successfully", admin });
  } catch (error) {
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

    if (admin.deletedAt && forceDelete !== 'true') {
      return res.status(400).json({ error: "Admin is already soft-deleted" });
    }

    if (forceDelete === 'true') {
      await admin.destroy({ force: true });
      res.status(200).json({ message: "Admin permanently deleted successfully" });
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
    const admins = await Admin.findAll();
    res.status(200).json(admins);
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

module.exports = {
  registerAdmin,
  loginAdmin,
  updateAdmin,
  deleteAdmin,
  getAllAdmins,
  getAdminById,
  logoutAdmin
};
