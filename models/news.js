const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    for_all: {
      type: Boolean,
      required: true,
    },
    images: {
      type: Array,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamp: true,
  }
);

const News = mongoose.model("News", newsSchema);

module.exports = News;
