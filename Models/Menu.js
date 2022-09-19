const mongoose = require("mongoose");

const menuSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    menuItem: {
      title: { type: String, default: null },
      description: { type: String, default: null },
      price: { type: Number, default: 0 },
      discount: { type: Number },
      discountValue: { type: Number },
      discountPrice: { type: Number, default: 0.0 },
      menuImage: { type: String, default: "" },
      // menuImage: [{ type: String, default: null }],
    },
    isActivated: { type: Boolean, default: 1 },
    isDeleted: { type: Boolean, default: 0 },
    imageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
