const mongoose = require("mongoose");

const paracticeSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,

    rating: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ratingStatus: { type: Number, default: 0, min: 0, max: 1 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paractice", paracticeSchema);
