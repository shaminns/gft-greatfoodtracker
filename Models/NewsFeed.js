const mongoose = require("mongoose");

const newsfeedSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    news: {
      description: { type: String, required: true },
      newsImage: [{ type: String }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsFeed", newsfeedSchema);
