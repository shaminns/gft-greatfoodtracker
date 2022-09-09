const moment = require("moment");
// Helpers
const responseHelper = require("../Services/ResponseHelper");
const vendorHelper = require("../Services/VendorHelper");
const userHelper = require("../Services/UserHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const packageHelper = require("../Services/PackageHelper");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");

//********************************************************************************
// Add Search Tags and Basic Detail api
//********************************************************************************
exports.addTagAndDetail = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let vendorData = await userHelper.findUserByEmail(request.email);

  let vendorId = vendorData._id;

  let arr = [];

  // Get Value against key (for search and filter)
  arr = await vendorHelper.getKey(true, request);

  if (arr.length == 0) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json({ response });
  }
  if (arr.length != 0) {
    let result = await vendorDetailHelper.addsearchTagAndBasicDetails(
      vendorId,
      request,
      arr
    );
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json({ response, result });
  }
};
//********************************************************************************
// Update Search Tags
//********************************************************************************
exports.updateSearchTag = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let vendorData = await userHelper.findUserByEmail(request.email);
  let vendorId = vendorData._id;

  let arr = [];
  // Get Value against key (for search and filter)
  arr = await vendorHelper.getKey(true, request);
  if (arr.length == 0) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json({ response });
  }

  if (arr.length != 0) {
    let result = await vendorDetailHelper.updateSearchTag(vendorId, arr);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json({ response, result });
  }
};
//********************************************************************************
// Set Vendor's Online Status
//********************************************************************************
exports.setOnline = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    await vendorDetailHelper.setOnlineStatus(vendorId, request);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Vendor Info api
//********************************************************************************
exports.showVendorInfo = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let result = await vendorDetailHelper.vendorInfo(vendorId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Vendor All Detail api
//********************************************************************************
exports.showVendorAllDetail = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let result = await vendorDetailHelper.vendorAllDetail(vendorId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Vendor Open/Close api
//********************************************************************************
exports.vendorOpenCloseStatus = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;

  let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
    vendorId
  );
  if (vendorDetail == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.USER_NOT_EXIST
    );
    return res.status(response.code).json(response);
  } else {
    let openTime = vendorDetail.servingHours.openTime;
    let closeTime = vendorDetail.servingHours.closeTime;
    let result;

    var format = "HH:mm";
    var time = moment(); //gives you current time. no format required.
    //var time = moment("00:45", format),
    (beforeTime = moment(openTime, format)),
      (afterTime = moment(closeTime, format));
    if (time.isBetween(beforeTime, afterTime)) {
      result = "Open";
    } else {
      result = "Close";
    }

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Show Vendor Subscription api
//********************************************************************************
exports.showVendorSubscription = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
      vendorId
    );

    let vendorPackage = vendorDetail.packageBought;
    let packageDetail = await packageHelper.findPackageById(vendorPackage);

    result = {
      packageId: packageDetail.packageId,
      packageTitle: packageDetail.packageTitle,
      packageDetail: packageDetail.packageDetail,
      packagePrice: packageDetail.price,
    };

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Update Vendor Package/Subscription api
//********************************************************************************
exports.updateVendorSubscription = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let packageId = req.body.packageId;
  // Check Token
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.FORBIDDEN,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;
  // User ID from Token
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let packageBoughtDetail = await packageHelper.findPackage(packageId);
    let package_id = packageBoughtDetail._id;

    await vendorDetailHelper.updateVendorPackageByPackageId(
      vendorId,
      package_id
    );

    let response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Add Vendor Location (presvious location) api
//********************************************************************************
exports.addVendorPreviousLocation = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  // Check Token
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.FORBIDDEN,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;
  // User ID from Token
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    await vendorDetailHelper.addVendorPreviousLocation(vendorId, request);
    let response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Get Vendor All Location api
//********************************************************************************
exports.getVendorAllLocation = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  // Check Token
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.FORBIDDEN,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;
  // User ID from Token
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let result = await vendorDetailHelper.getVendorAllLocation(vendorId);
    let response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Check isTrail Expire - for vendor
//********************************************************************************
exports.isTrialExpire = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  if (!req.headers.authorization) {
    //fs.unlinkSync(filePath);
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  let trialExpiryStatus;
  // Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    //fs.unlinkSync(filePath);
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
      vendorId
    );

    let expiryDate = moment(vendorDetail.packageTrialExpiry).format(
      "YYYY-MM-DD"
    );
    let todayDate = moment().format("YYYY-MM-DD");
    let momentExpiry = moment(expiryDate);
    let momentToday = moment(todayDate);
    let remainningDays = momentExpiry.diff(momentToday, "days"); // => 1
    if (remainningDays < 0) {
      trialExpiryStatus = true;
    } else trialExpiryStatus = false;

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.isTrialExpire = trialExpiryStatus;
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// show Stripe Detail for Update - for vendor
//********************************************************************************
exports.showStripeDetailForUpdate = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  if (!req.headers.authorization) {
    //fs.unlinkSync(filePath);
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  let trialExpiryStatus;
  // Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    //fs.unlinkSync(filePath);
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let vendorDetail = await userHelper.findUserById(vendorId);
    let stripePublicKey = vendorDetail.stripeDetail.publicKey;
    let stripeSecretKey = vendorDetail.stripeDetail.secretKey;
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.stripePublicKey = stripePublicKey;
    response.stripeSecretKey = stripeSecretKey;
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Check isSubscription Expire - for vendor
//********************************************************************************
exports.isSubscriptionExpire = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let packageExpiryStatus;
  if (!req.headers.authorization) {
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }

  // Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
      vendorId
    );

    let expiryDate = moment(vendorDetail.packageTrialExpiry).format(
      "YYYY-MM-DD"
    );
    let todayDate = moment().format("YYYY-MM-DD");
    let momentTrialExpiry = moment(expiryDate);
    let momentToday = moment(todayDate);
    let remainningTrialDays = momentTrialExpiry.diff(momentToday, "days"); // => 1

    let packageExpiryDate = moment(vendorDetail.packageExpiry).format(
      "YYYY-MM-DD"
    );
    let momentExpiry = moment(packageExpiryDate);

    let remainningDays = momentExpiry.diff(momentToday, "days"); // => 1
    if (remainningDays < 0 && remainningTrialDays < 0) {
      packageExpiryStatus = true;
    } else packageExpiryStatus = false;

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.isPackageExpire = packageExpiryStatus;
    response.packageDate = vendorDetail.packageExpiry;
    return res.status(response.code).json(response);
  }
};
