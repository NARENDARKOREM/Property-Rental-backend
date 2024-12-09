const { Op } = require('sequelize');
const PlanPurchaseHistory = require('../models/PlanPurchaseHistory');
const TblPackage = require('../models/TblPackage'); // Import the TblPackage model

// Fetch Current User's Plans
const getUserPlans = async (req, res) => {
  const uid = req.user.id; // Get the user ID from the authenticated user
  try {
    const plans = await PlanPurchaseHistory.findAll({ where: { uid } });
    res.status(200).json(plans);
  } catch (error) {
    console.error("Error in getUserPlans: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Upsert Plan Purchase History
const upsertPlanPurchaseHistory = async (req, res) => {
  const { id, plan_id, plan_title, p_name, t_date, expire_date, start_date, trans_id } = req.body;
  const uid = req.user.id; // Get the user ID from the authenticated user

  try {
    // Fetch package details using either plan_id or plan_title
    let pkg;
    if (plan_id) {
      pkg = await TblPackage.findByPk(plan_id);
    } else if (plan_title) {
      pkg = await TblPackage.findOne({ where: { title: plan_title } });
    }

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (id) {
      // Update plan purchase history
      const plan = await PlanPurchaseHistory.findByPk(id);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      plan.uid = uid;
      plan.plan_id = pkg.id;
      plan.p_name = p_name;
      plan.t_date = t_date;
      plan.amount = pkg.price; // Use package price as amount
      plan.day = pkg.day; // Use package day
      plan.plan_title = pkg.title; // Use package title
      plan.plan_description = pkg.description; // Use package description
      plan.expire_date = expire_date;
      plan.start_date = start_date;
      plan.trans_id = trans_id;

      await plan.save();
      res.status(200).json({ message: 'Plan updated successfully', plan });
    } else {
      // Create new plan purchase history
      const plan = await PlanPurchaseHistory.create({
        uid,
        plan_id: pkg.id,
        p_name,
        t_date,
        amount: pkg.price, // Use package price as amount
        day: pkg.day, // Use package day
        plan_title: pkg.title, // Use package title
        plan_description: pkg.description, // Use package description
        expire_date,
        start_date,
        trans_id
      });
      res.status(201).json({ message: 'Plan created successfully', plan });
    }
  } catch (error) {
    console.error("Error in upsertPlanPurchaseHistory: ", error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getUserPlans,
  upsertPlanPurchaseHistory
};
