const mongoose = require("mongoose");

const appleUserSchema = mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    isAppleUser: { type: Boolean, default: false },
    recordNumber: { type: Number, defualt: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppleUser", appleUserSchema);
