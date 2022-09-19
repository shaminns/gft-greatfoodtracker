const mongoose = require("mongoose");

const foodCategoriesSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    filterName: { type: String, required: true },
    isActivated: { type: Boolean, default: 1 },
    isDeleted: { type: Boolean, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodCategories", foodCategoriesSchema);
