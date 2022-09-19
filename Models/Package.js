const mongoose = require("mongoose");

const packageSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    packageId: { type: Number },
    packageTitle: { type: String },
    packageDetail: { type: String, required: true },
    price: { type: Number },
    imageLimit: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
