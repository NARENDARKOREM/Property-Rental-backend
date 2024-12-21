const PaymentList = require("../models/PaymentList");
const path = require("path");
const fs = require("fs");
const { count } = require("console");
const { where } = require("sequelize");

// Get all payment methods
const getAllPayments = async (req, res) => {
  try {
    const payments = await PaymentList.findAll();
    
    res.status(200).json(payments);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
const getAllPaymentsbystatus = async (req, res) => {
  try {
    const payments = await PaymentList.findAll({
      where: { status: 1 },
    });
    
    res.status(200).json({
      paymentdata: payments,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Payment Gateway List Founded!",
    });
  } catch (error) {
    res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Failed to retrieve payment gateways.",
    });
  }
};

// Get Payments Count
const getPaymentCount = async (req, res) => {
  try {
    const paymentCount = await PaymentList.count();
    res.status(200).json({ count: paymentCount });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Get a single payment method
const getPaymentById = async (req, res) => {
  try {
    const payment = await PaymentList.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    res.status(200).json(payment);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Create a new payment method
const createPayment = async (req, res) => {
  const { title, subtitle, attributes, status, p_show, s_show } = req.body;
  let img = req.body.img;

  if (req.file) {
    img = `uploads/${req.file.filename}`;
  }

  try {
    const newPayment = await PaymentList.create({
      title,
      subtitle,
      img,
      attributes,
      status,
      p_show,
      s_show,
    });
    res
      .status(201)
      .json({ message: "Payment method created successfully", newPayment });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Update a payment method
const updatePayment = async (req, res) => {
  const { title, subtitle, attributes, status, p_show, s_show } = req.body;
  let img = req.body.img;

  if (req.file) {
    img = `uploads/${req.file.filename}`;
  }

  try {
    const payment = await PaymentList.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    if (req.file && payment.img && !payment.img.startsWith("http")) {
      fs.unlinkSync(path.join(__dirname, "..", payment.img)); // Remove old image if not a URL
    }

    await payment.update({
      title,
      subtitle,
      img,
      attributes,
      status,
      p_show,
      s_show,
    });

    res
      .status(200)
      .json({ message: "Payment method updated successfully", payment });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// Delete a payment method (soft delete by default, hard delete with query)
const deletePayment = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const payment = await PaymentList.findOne({
      where: { id },
      paranoid: false,
    });
    if (!payment) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    if (payment.deletedAt && forceDelete !== "true") {
      return res
        .status(400)
        .json({ error: "Payment method is already soft-deleted" });
    }

    if (forceDelete === "true") {
      await payment.destroy({ force: true });
      res
        .status(200)
        .json({ message: "Payment method permanently deleted successfully" });
    } else {
      await payment.destroy();
      res
        .status(200)
        .json({ message: "Payment method soft-deleted successfully" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};



const togglePaymentStatus = async (req, res) => {
  const { id, field, value } = req.body;
  try {
    if (!["status", "p_show", "s_show"].includes(field)) {
      return res.status(400).json({ message: "Invalid field for update. " });
    }
    const payment = await PaymentList.findByPk(id);
    if (!payment) {
      console.log("Payment list not found");
      return res.status(404).json({ message: "Payment list not found." });
    }
    payment[field] = value;
    await payment.save();
    console.log("Payment status updated", payment);
    res.status(200).json({
      message: `${field} updated successfully.`,
      updatedField: field,
      updatedValue: value,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentCount,
  togglePaymentStatus,
  getAllPaymentsbystatus
};
