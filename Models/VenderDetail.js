const mongoose = require("mongoose");
const { NIL } = require("uuid");

const vendorDetailSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    coverImage: { type: String, default: "default.jpg" },
    vendorType: { type: String },
    timeTable: [
      {
        day: { type: String, default: "" },
        openTime: { type: String, default: "" },
        closeTime: { type: String, default: "" },
      },
    ],
    packageBought: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    packageTrialExpiry: { type: String, default: "" },
    packageExpiry: { type: String, default: "" },
    phoneNumber: { type: String, default: null },
    country: { type: String, default: null },
    city: { type: String, default: null },
    approvedPackage: { type: Boolean, default: null },
    isOnline: { type: Boolean, default: false },
    searchTag: [{ type: String }],
    servingHours: {
      openTime: { type: String },
      closeTime: { type: String },
    },
    previousLocations: [
      {
        locationName: { type: String },
        longitude: { type: Number, default: 44.28632144372157 },
        latitude: { type: Number, default: -76.4970230628745 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorDetail", vendorDetailSchema);
