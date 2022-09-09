const fs = require("fs");
//Mongoose
const mongoose = require("mongoose");

// Helpers
const responseHelper = require("../Services/ResponseHelper");
const foodCategoriesHelper = require("../Services/FoodCategoriesHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");

//********************************************************************************
// Add Food Categories
//********************************************************************************
exports.addFoodCatgories = async (req, res, next) => {
  let request = req.body;

  let food = await foodCategoriesHelper.findFoodByName(
    request.filterName.toLowerCase()
  );
  if (food != null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.ALREADY_EXIST
    );
    return res.status(response.code).json(response);
  }
  if (food == null) {
    await foodCategoriesHelper.saveFoodCategories(request);

    let response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Show Food Categories (for filters)
//********************************************************************************
exports.showFoodCatgories = async (req, res, next) => {
  let result = await foodCategoriesHelper.showAllFoodCategories();
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Delete Food Categories (for admin)
//********************************************************************************
exports.deleteFoodCatgories = async (req, res, next) => {
  let request = req.body;
  let foodCategoryDetail = await foodCategoriesHelper.findFoodById(request._id);
  let filterNameFromId = foodCategoryDetail.filterName;
  let vendorTag = await vendorDetailHelper.findSearchTagExist(filterNameFromId);
  if (vendorTag.length > 0) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IN_USE
    );
    return res.status(response.code).json(response);
  }
  if (vendorTag.length == 0) {
    await foodCategoriesHelper.deleteFoodCategory(request._id);
    let response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Search Food Categories (for Admin)
//********************************************************************************
exports.findFoodCatgoriesByName = async (req, res, next) => {
  let categoryName = req.body.categoryName;
  let result = await foodCategoriesHelper.findFoodByNameForSearch(
    categoryName.toLowerCase()
  );
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
