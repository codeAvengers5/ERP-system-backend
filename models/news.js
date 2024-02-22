const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  news_id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  for_all: {
    type: Boolean,
    required: true,
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  images: [{
    type: String,
    required: true,
  }],
  description: {
    type: String,
    required: true,
  },
});

const News = mongoose.model('News', newsSchema);

module.exports = News;