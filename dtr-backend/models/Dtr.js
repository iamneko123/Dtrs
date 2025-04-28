const mongoose = require('mongoose');

const dtrSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  morningIn: {
    type: String,
  },
  morningOut: {
    type: String,
  },
  afternoonIn: {
    type: String,
  },
  afternoonOut: {
    type: String,
  },
  type: {
    type: String,
    required: true,  // Ensure type is required
  }
});

const Dtr = mongoose.model('Dtr', dtrSchema);
module.exports = Dtr;
