const mongoose = require("mongoose");

const creditCardSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String },
    name: { type: String, default: null },
    cardNo: { type: Number, required: true },
    expiryDate: { type: String, required: true },
    cvvCode: { type: Number, required: true },
    cardType: { type: String }, // VISA,MasterCard.....
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditCard", creditCardSchema);
