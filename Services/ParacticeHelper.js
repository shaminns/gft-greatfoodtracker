//Mongoose
const mongoose = require("mongoose");

//Models
const Paractice = require("../Models/Paractice");
const Vendordetail = require("../Models/VenderDetail");

exports.setRating = async (data) => {
  await Paractice.updateOne(
    { _id: data.vendorId },
    {
      $push: {
        rating: data.rating,
      },
    }
  );
};
exports.getRating = async (data) => {
  return await Paractice.findOne({ _id: data.vendorId });
};
