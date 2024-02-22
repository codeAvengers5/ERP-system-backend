const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  promotion_id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
});

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;