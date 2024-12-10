const Page = require('../models/Page');

// Create or Update Page
const upsertPage = async (req, res) => {
  const { id, ctitle, cstatus, cdesc } = req.body;
  console.log(req.body)
  try {
    if (id) {
      // Update page
      const page = await Page.findByPk(id);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      page.title = ctitle;
      page.status = cstatus;
      page.description = cdesc;

      await page.save();
      res.status(200).json({ message: 'Page updated successfully', page });
    } else {
      // Create new page
      const page = await Page.create({
        title: ctitle,
        status: cstatus,
        description: cdesc
      });
      res.status(201).json({ message: 'Page created successfully', page });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get All Pages
const getAllPages = async (req, res) => {
  try {
    const pages = await Page.findAll();
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get Single Page by ID
const getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await Page.findByPk(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Delete Page
const deletePage = async (req, res) => {
  const { id } = req.params;
  const { forceDelete } = req.query;
  try {
    const page = await Page.findOne({ where: { id }, paranoid: false });
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (page.deletedAt && forceDelete !== 'true') {
      return res.status(400).json({ error: 'Page is already soft-deleted' });
    }

    if (forceDelete === 'true') {
      await page.destroy({ force: true });
      res.status(200).json({ message: 'Page permanently deleted successfully' });
    } else {
      await page.destroy();
      res.status(200).json({ message: 'Page soft-deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  upsertPage,
  getAllPages,
  getPageById,
  deletePage
};
