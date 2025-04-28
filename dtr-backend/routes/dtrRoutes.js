const express = require('express');
const router = express.Router();
const Dtr = require('../models/Dtr');

/// Time In/Out API
router.post('/time', async (req, res) => {
      const { userId, type } = req.body;  // Ensure 'type' is included in the body
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
      try {
        let dtr = await Dtr.findOne({ userId, date: today });
    
        if (!dtr) {
          dtr = new Dtr({ userId, date: today, type });  // Pass 'type' when creating a new DTR
        }
    
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    
        if (type === 'morningIn') dtr.morningIn = currentTime;
        if (type === 'morningOut') dtr.morningOut = currentTime;
        if (type === 'afternoonIn') dtr.afternoonIn = currentTime;
        if (type === 'afternoonOut') dtr.afternoonOut = currentTime;
    
        await dtr.save();
        res.json({ message: 'Time recorded successfully!', dtr });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    
// Get all DTRs (Admin Only)
router.get('/all', async (req, res) => {
  try {
    const dtrs = await Dtr.find().populate('userId', 'username');
    res.json(dtrs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
