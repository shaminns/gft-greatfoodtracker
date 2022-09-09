const fs = require("fs");
//Mongoose
const mongoose = require("mongoose");

// Helpers

const responseHelper = require("../Services/ResponseHelper");
const PackageHelper = require("../Services/PackageHelper");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");

//********************************************************************************
// Add Package Detail (Run one time only after add / update package details)
//********************************************************************************
exports.addPackage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  let packageOneTitle = request.packageOneTitle;
  let packageOne = request.packageOne;
  let packageOnePrice = request.packageOnePrice;
  let packageOneImageLimit = request.packageOneImageLimit;

  let packageTwoTitle = request.packageTwoTitle;
  let packageTwo = request.packageTwo;
  let packageTwoPrice = request.packageTwoPrice;
  let packageTwoImageLimit = request.packageTwoImageLimit;
  let packageThreeTitle = request.packageThreeTitle;
  let packageThree = request.packageThree;
  let packageThreePrice = request.packageThreePrice;
  let packageThreeImageLimit = request.packageThreeImageLimit;

  let packageOneId = 1;
  let packageTwoId = 2;
  let packageThreeId = 3;

  let packageTwoCheck;
  let packageThreeCheck;

  if (
    !(
      packageTwoTitle &&
      packageTwo &&
      packageTwoPrice &&
      packageTwoImageLimit &&
      packageThreeTitle &&
      packageThree &&
      packageThreePrice &&
      packageThreeImageLimit
    )
  ) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }

  ///dumy package for registration vendor by admin
  packageOneCheck = await PackageHelper.findPackage(packageOneId);

  if (packageOneCheck == null) {
    console.log("Package 1 not exist");
    await PackageHelper.savePackage(
      packageOneId,
      packageOneTitle,
      packageOne,
      packageOnePrice,
      packageOneImageLimit
    );
    console.log("Package One Detail Add Successfully");
  }
  if (packageOneCheck != null) {
    console.log("Package 1 already exist");
  }

  packageTwoCheck = await PackageHelper.findPackage(packageTwoId);

  if (packageTwoCheck == null) {
    console.log("Package 2 not exist");
    await PackageHelper.savePackage(
      packageTwoId,
      packageTwoTitle,
      packageTwo,
      packageTwoPrice,
      packageTwoImageLimit
    );
    console.log("Package Two Detail Add Successfully");
  }
  if (packageTwoCheck != null) {
    console.log("Package 2 already exist");
  }
  packageThreeCheck = await PackageHelper.findPackage(packageThreeId);

  if (packageThreeCheck == null) {
    console.log("Package 3 not exist");
    await PackageHelper.savePackage(
      packageThreeId,
      packageThreeTitle,
      packageThree,
      packageThreePrice,
      packageThreeImageLimit
    );
    console.log("Package Three Detail Add Successfully");
  }
  if (packageThreeCheck != null) {
    console.log("Package 3 already exist");
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Update Package Detail
//********************************************************************************
exports.updatePackage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  let packageId = request.packageId;

  let packageCheck = await PackageHelper.findPackage(packageId);
  if (packageCheck == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.PACKAGE_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }

  if (packageCheck != null) {
    await PackageHelper.updatePackage(request);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Get All Package Details
//********************************************************************************
exports.getAllPackage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  let packageResult = await PackageHelper.allPackage();
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    packageResult
  );
  return res.status(response.code).json(response);
};
