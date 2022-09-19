const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    orderBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderTo: { type: mongoose.Schema.Types.ObjectId, res: "User" },
    orderItem: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
        quantity: { type: Number },
      },
    ],
    totalQuantity: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
