const PaymentList = require('../models/PaymentList');
const path = require('path');
const fs = require('fs');

// Get all payment methods
const getAllPayments = async (req, res) => {
  try {
    const payments = await PaymentList.findAll();
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get a single payment method
const getPaymentById = async (req, res) => {
  try {
    const payment = await PaymentList.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
      s_show
    });
    res.status(201).json({ message: 'Payment method created successfully', newPayment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (req.file && payment.img && !payment.img.startsWith('http')) {
      fs.unlinkSync(path.join(__dirname, '..', payment.img)); // Remove old image if not a URL
    }

    await payment.update({
      title,
      subtitle,
      img,
      attributes,
      status,
      p_show,
      s_show
    });

    res.status(200).json({ message: 'Payment method updated successfully', payment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Delete a payment method (soft delete by default, hard delete with query)
const deletePayment = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;

  try {
    const payment = await PaymentList.findOne({ where: { id }, paranoid: false });
    if (!payment) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (payment.deletedAt && forceDelete !== 'true') {
      return res.status(400).json({ error: 'Payment method is already soft-deleted' });
    }

    if (forceDelete === 'true') {
      await payment.destroy({ force: true });
      res.status(200).json({ message: 'Payment method permanently deleted successfully' });
    } else {
      await payment.destroy();
      res.status(200).json({ message: 'Payment method soft-deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};
