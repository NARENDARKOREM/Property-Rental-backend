const TblFaq = require('../models/TblFaq');

// Create or Update FAQ
const upsertFaq = async (req, res) => {
  const { id, question, answer, status } = req.body;
  console.log(req.body)
  try {
    if (id) {
      // Update FAQ
      const faq = await TblFaq.findByPk(id);
      if (!faq) {
        return res.status(404).json({ error: 'FAQ not found' });
      }

      faq.question = question;
      faq.answer = answer;
      faq.status = status;

      await faq.save();
      res.status(200).json({ message: 'FAQ updated successfully', faq });
    } else {
      // Create new FAQ
      const faq = await TblFaq.create({
        question,
        answer,
        status
      });
      res.status(201).json({ message: 'FAQ created successfully', faq });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get All FAQs
const getAllFaqs = async (req, res) => {
  try {
    const faqs = await TblFaq.findAll();
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get Single FAQ by ID
const getFaqById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await TblFaq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.status(200).json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Delete FAQ
const deleteFaq = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;
  console.log(id)
  console.log(forceDelete)
  
  try {
    const faq = await TblFaq.findOne({ where: { id }, paranoid: false });
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    if (faq.deletedAt && forceDelete !== 'true') {
      return res.status(400).json({ error: 'FAQ is already soft-deleted' });
    }

    if (forceDelete === 'true') {
      await faq.destroy({ force: true });
      res.status(200).json({ message: 'FAQ permanently deleted successfully' });
    } else {
      await faq.destroy();
      res.status(200).json({ message: 'FAQ soft-deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  upsertFaq,
  getAllFaqs,
  getFaqById,
  deleteFaq
};
