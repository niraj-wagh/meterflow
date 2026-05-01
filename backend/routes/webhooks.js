const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook');
const { protect } = require('../middleware/auth');
const axios = require('axios');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const webhooks = await Webhook.find({ user: req.user._id });
    res.json({ success: true, data: webhooks });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const webhook = await Webhook.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const webhook = await Webhook.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    res.json({ success: true, data: webhook });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Webhook.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) { next(err); }
});

// Test webhook
router.post('/:id/test', async (req, res, next) => {
  try {
    const webhook = await Webhook.findOne({ _id: req.params.id, user: req.user._id });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });
    await axios.post(webhook.url, { event: 'test', timestamp: new Date(), message: 'MeterFlow test webhook' }, { timeout: 5000 });
    res.json({ success: true, message: 'Test webhook delivered' });
  } catch (err) {
    res.status(400).json({ success: false, message: `Delivery failed: ${err.message}` });
  }
});

module.exports = router;
