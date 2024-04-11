const Policy = require("../models/policy");
const joi = require("joi");
const policyValidator = joi.object({
    date: joi.date().required(),
    title: joi.string().required(),
    content: joi.string().required(),
  });
  
  async function createPolicy(req, res) {
    const { error } = policyValidator.validate(req.body);
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    const { date, title, content } = req.body;
  
    try {
      const policy = new Policy({
        date,
        title,
        content,
      });
  
      await policy.save();
  
      res.status(201).json({
        message: 'Policy created successfully',
        policy,
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Failed to create policy' });
    }
  }
  
  async function updatePolicyById(req, res) {
    const { error } = policyValidator.validate(req.body);
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    const { id } = req.params;
    const { date, title, content } = req.body;
  
    try {
      const policy = await Policy.findByIdAndUpdate(
        id,
        {
          date,
          title,
          content,
        },
        { new: true }
      );
  
      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }
  
      res.json({ message: 'Policy updated successfully', policy });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update policy' });
    }
  }

async function getAllPolicies(req, res) {
  try {
    const policies = await Policy.find();

    res.status(200).json(policies);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
}

async function getPolicyById(req, res) {
  try {
    const { id } = req.params;
    const policy = await Policy.findById(id);

    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch policy" });
  }
}
async function deletePolicyById(req, res) {
  try {
    const { id } = req.params;

    const policy = await Policy.findByIdAndDelete(id);

    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete policy" });
  }
}

module.exports = {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  updatePolicyById,
  deletePolicyById,
};