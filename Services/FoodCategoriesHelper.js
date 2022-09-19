//Mongoose
const mongoose = require("mongoose");

//Models
const FoodCategories = require("../Models/FoodCategories");

exports.saveFoodCategories = async (data) => {
  const food = new FoodCategories({
    _id: new mongoose.Types.ObjectId(),
    filterName: data.filterName,
  });

  await food.save();
};

exports.showAllFoodCategories = async () => {
  return await FoodCategories.find({}, { _id: 1, filterName: 1 });
};

exports.findFoodByName = async (filterName) => {
  return await FoodCategories.findOne({ filterName: filterName });
};

exports.findFoodById = async (_id) => {
  return await FoodCategories.findOne({ _id: _id });
};

exports.deleteFoodCategory = async (_id) => {
  return await FoodCategories.deleteOne({ _id: _id });
};
exports.findFoodByNameForSearch = async (categoryName) => {
  return await FoodCategories.find({ filterName: { $regex: categoryName } });
};
