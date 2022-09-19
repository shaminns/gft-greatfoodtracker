const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, default: "" },
    email: { type: String, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "default.jpg" },
    role: { type: String, required: true, default: "User" },
    isDeleted: { type: Boolean, default: 0 },
    deletedAt: { type: Date, default: "" },
    //activationCode: { type: Number, min: 111111, max: 999999 },
    isActivated: { type: Boolean, default: null },
    longitude: { type: Number, default: 44.28632144372157 },
    latitude: { type: Number, default: -76.4970230628745 },
    address: { type: String, default: "" },

    forgotCode: { type: Number, min: 111111, max: 999999 },
    favouriteStatus: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package" },
    rating: [{ type: Number, default: 0 }],
    bankDetail: {
      bankName: { type: String, defualt: "" },
      accountHolderName: { type: String, defualt: "" },
      accountNumber: { type: Number, defualt: "" },
    },
    stripeDetail: {
      publicKey: { type: String, defualt: "" },
      secretKey: { type: String, defualt: "" },
    },
    deviceToken: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
