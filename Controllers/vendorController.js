const jwt = require("jsonwebtoken");
const fs = require("fs");
const moment = require("moment");

// Helpers
const vendorHelper = require("../Services/VendorHelper");
const responseHelper = require("../Services/ResponseHelper");
const generalHelper = require("../Services/GeneralHelper");
const userHelper = require("../Services/UserHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const packageHelper = require("../Services/PackageHelper");
const orderHelper = require("../Services/OrderHelper");
const creditCardHelper = require("../Services/CreditCardHelper");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");

////********************************************************************************
// Signup - Save Record (Vendor)
////********************************************************************************
exports.saveRecord = async (req, res) => {
  let request = req.body;
  let passwordEncryption = await generalHelper.bcryptPassword(request.password);
  let role = "Vendor";

  let resultCheck;
  let vendorPassword = request.password;
  let userToken = null;
  let userRole = null;
  let result;

  if (req.headers.authorization) {
    userToken = req.headers.authorization;
  }
  if (userToken != null) {
    userRole = tokenExtractor.getRoleFromToken(userToken);
  }

  await vendorHelper.saveRecord(
    request.name,
    role,
    request.email.toLowerCase(),
    passwordEncryption,

    userRole
  );
  await userHelper.updateDeviceToken(request.email, request.deviceToken);
  let user = await userHelper.findUserByEmail(request.email.toLowerCase());

  const token = jwt.sign(
    {
      email: user.email,
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "12h",
    }
  );
  result = {
    _id: user.id,
    role: user.role,
    email: user.email,
    user_detail: user.name,
  };

  let vendorResult = await userHelper.findUserByEmail(
    request.email.toLowerCase()
  );
  let vendorId = vendorResult._id;
  await vendorDetailHelper.saveVendorDetail(request, vendorId);

  let vendorType = request.vendorType;

  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REGISTER_SUCCESS,
    result
  );
  response.vendorType = vendorType;
  response.token = token;

  return res.status(response.code).json(response);
};

////********************************************************************************
// Buy Package api
////********************************************************************************
exports.buyPackage = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let userEmail = request.email;
  let vendorData = await userHelper.findUserByEmail(userEmail);
  let vendorId = vendorData._id;
  let vendorPackage = req.body.vendorPackage;
  let packageDetail = await packageHelper.findPackage(vendorPackage);
  let packageId = packageDetail._id;
  let packageAmount = packageDetail.price;
  await vendorDetailHelper.setPackage(vendorId, packageId);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.PACKAGE_SELECTED
  );
  response.Price = packageAmount;
  return res.status(response.code).json(response);
};

//********************************************************************************
// Update Vendor api
//********************************************************************************
exports.updateVendor = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let userEmail = req.body.email;
  let vendorId;
  let token;
  let user;
  let uRole;

  // if (!req.file) {
  //   response = responseHelper.setResponse(
  //     responseCode.NOT_SUCCESS,
  //     Message.IMAGE_NOT_READ
  //   );
  //   return res.status(response.code).json(response);
  // }
  // // Get Path of New Store Image
  // let profileImagePath = req.file.path;
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  if (req.headers.authorization) {
    // Get Token
    token = req.headers.authorization;
  }

  let userRole = await tokenExtractor.getRoleFromToken(token);
  let vendorIdFromToken = await tokenExtractor.getInfoFromToken(token);

  if (userRole == "Admin") {
    if (!userEmail) {
      // fs.unlinkSync(profileImagePath);
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.EMAIL_REQUIRED
      );
      return res.status(response.code).json(response);
    }
    user = await userHelper.findUserByEmail(userEmail);

    if (user == null) {
      // fs.unlinkSync(profileImagePath);
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.USER_NOT_EXIST
      );
      return res.status(response.code).json(response);
    }
    uRole = user.role;

    if (uRole == "User") {
      // fs.unlinkSync(profileImagePath);
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.ROLE_NOT_ALLOWED
      );
      return res.status(response.code).json(response);
    }
    vendorId = user._id;
    if (uRole == "Vendor") {
      if (vendorId === null) {
        //  fs.unlinkSync(profileImagePath);

        response = responseHelper.setResponse(
          responseCode.EXCEPTION,
          Message.INVALID_TOKEN
        );
        return res.status(response.code).json(response);
      }
      if (vendorId !== null) {
        // Update Vendor Info
        await userHelper.updateUserAllInfo(vendorId, req.body);

        // Update Vendor Detail
        await vendorDetailHelper.updateVendorDetail(vendorId, req.body);

        // Update Serving Hours
        await vendorDetailHelper.updateServingTime(vendorId, req.body);

        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.UPDATE_SUCCESS
        );
        return res.status(response.code).json(response);
      }
    }
  }
  if (userRole != "Admin") {
    // User ID from Token
    //userId = await tokenExtractor.getInfoFromToken(token);
    // Update Vendor Info

    await userHelper.updateUserAllInfo(vendorIdFromToken, req.body);

    // Update Vendor Detail
    await vendorDetailHelper.updateVendorDetail(vendorIdFromToken, req.body);

    // Update Serving Hours
    await vendorDetailHelper.updateServingTime(vendorIdFromToken, req.body);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.UPDATE_SUCCESS
    );
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// View Profile api
//********************************************************************************
exports.viewVendorProfile = async (req, res) => {
  let response = responseHelper.getDefaultResponse();

  // Get Token
  let token = req.headers.authorization;
  // Vendor ID from Token
  let vendorId = await tokenExtractor.getInfoFromToken(token);

  let user = await userHelper.findUserById(vendorId);
  let result = {
    name: user.name,
    profileImage: user.profileImage,
    email: user.email,
    city: user.city,
    country: user.country,
  };
  if (user == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.USER_NOT_EXIST
    );
    return res.status(response.code).json(response);
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// Get Vendor Location api
//********************************************************************************
exports.getVendorLocation = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  let vendorLocation = await userHelper.findUserById(vendorId);

  let result = {
    longitude: vendorLocation.longitude,
    latitude: vendorLocation.latitude,
  };
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// Get Vendor Detail api
//********************************************************************************
exports.getVendorDetail = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  let getVendorDetail = await vendorHelper.getVendorDetail(vendorId);

  if (!getVendorDetail) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.WENT_WRONG
    );

    return res.status(response.code).json(response);
  }
  let packageDetail = await packageHelper.findPackageById(
    getVendorDetail.packageBought
  );

  if (packageDetail.packageId == null) {
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.PACKAGE_NULL
    );
    response.Detail = getVendorDetail;
    response.packageId = packageDetail.packageId;
    return res.status(response.code).json(response);
  }

  if (packageDetail.packageId != null) {
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.Detail = getVendorDetail;
    response.packageId = packageDetail.packageId;
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// View All Vendor List api
//********************************************************************************
exports.findAllVendors = async (req, res, next) => {
  let request = req.body;
  let userRole = "Vendor";
  let pageNo = req.body.pageNo;
  this.isPageNumber(request, res);
  let result = await userHelper.findAllVendors(pageNo);

  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Search Vendor By Name (for admin) api
//********************************************************************************
exports.searchVendorByName = async (req, res, next) => {
  let request = req.body;
  let userRole = "Vendor";
  let vendorName = request.name;
  let vendorArr = [];
  let vendorData = await userHelper.getUsersByName(
    userRole,
    vendorName.toLowerCase()
  );
  for (let i = 0; i < vendorData.length; i++) {
    let vendorId = vendorData[i]._id;
    let vendorDetailData =
      await vendorDetailHelper.findPendingVendorDetailByVendorId(vendorId);
    vendorArr.push({
      vendorData: vendorData[i],
      vendorDetailData: vendorDetailData,
    });
  }
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    vendorArr
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// Add Vendor Image api
//********************************************************************************
exports.addVendorImage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let userEmail = req.body.email;
  let imagePath;
  // Vendor ID

  if (!req.file) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IMAGE_NOT_READ
    );
    return res.status(response.code).json(response);
  }

  if (req.file) {
    // Get Path of New Store Image
    imagePath = req.file.path;
  }
  let user = await userHelper.findUserByEmail(userEmail);
  if (user == null) {
    fs.unlinkSync(imagePath);
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.WENT_WRONG
    );
    return res.status(response.code).json(response);
  }

  let vendorId = user._id;
  if (user != null) {
    await userHelper.addProfileImage(vendorId, imagePath);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Add Vendor Cover api
//********************************************************************************
exports.addVendorCover = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let userEmail = req.body.email;
  let imagePath;
  // Vendor ID
  let user = await userHelper.findUserByEmail(userEmail);
  let vendorId = user._id;
  if (!req.file) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IMAGE_NOT_READ
    );
    return res.status(response.code).json(response);
  }

  if (req.file) {
    // Get Path of New Store Image
    imagePath = req.file.path;
  }
  await vendorDetailHelper.addCoverImage(vendorId, imagePath);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Update Vendor Cover api
//********************************************************************************
exports.updateVendorCover = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let imagePath;
  if (!req.file) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IMAGE_NOT_READ
    );
    return res.status(response.code).json(response);
  }

  if (req.file) {
    // Get Path of New Store Image
    imagePath = req.file.path;
  }
  // Check Token
  if (!req.headers.authorization) {
    fs.unlinkSync(imagePath);
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
    fs.unlinkSync(imagePath);
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

    let previousCover = vendorDetail.coverImage;
    fs.unlinkSync(previousCover);
    await vendorDetailHelper.addCoverImage(vendorId, imagePath);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Update Vendor Profile Image api
//********************************************************************************
exports.updateVendorProfileImage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let imagePath;

  if (!req.file) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IMAGE_NOT_READ
    );
    return res.status(response.code).json(response);
  }

  if (req.file) {
    // Get Path of New Store Image
    imagePath = req.file.path;
  }

  // Check Token
  if (!req.headers.authorization) {
    fs.unlinkSync(imagePath);
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
    fs.unlinkSync(imagePath);
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let vendorDetail = await userHelper.findUserById(vendorId);

    let previousProfileImage = vendorDetail.profileImage;
    if (previousProfileImage == "default.jpg") {
      await userHelper.addProfileImage(vendorId, imagePath);

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
    if (previousProfileImage != "default.jpg") {
      fs.unlinkSync(previousProfileImage);

      await userHelper.addProfileImage(vendorId, imagePath);

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Set Vendor Location - Signup api
//********************************************************************************
exports.setSignupLocation = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let userEmail = req.body.email;
  await vendorHelper.setSignupLocation(userEmail, request);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// Show Search Tags api
//********************************************************************************
exports.showSearchTagsForUpdate = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
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
    let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
      vendorId
    );

    let result = vendorDetail.searchTag;
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Show Received Payments api
//********************************************************************************
exports.showReceivePayment = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
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
    let result = await orderHelper.showReceivePayment(vendorId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Search Pending Vendor api - (for admin)
//********************************************************************************
exports.searchPendingSubsVendor = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorName = req.body.name;
  let finalResultArr = [];
  let package;
  let vendorData = await vendorDetailHelper.searchPendingSubsVendor(
    vendorName.toLowerCase()
  );
  if (vendorData != null) {
    for (let i = 0; i < vendorData.length; i++) {
      let vendorDetailData =
        await vendorDetailHelper.findPendingVendorDetailByVendorId(
          vendorData[i]._id
        );
      let packageStatus = vendorDetailData.packageBought;
      let approvedPackage = vendorDetailData.approvedPackage;

      let vendorType = vendorDetailData.vendorType;
      if (packageStatus == null && approvedPackage == false) {
        finalResultArr.push({
          vendorResult: vendorData[i],
          packageStatus: packageStatus,
          approvedPackage: approvedPackage,
          vendorType: vendorType,
        });
      }
    }
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    finalResultArr
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Search Decline Vendor api - (for admin)
//********************************************************************************
exports.searchDeclineVendorList = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorName = req.body.name;
  let finalResultArr = [];
  let package;
  let vendorData = await vendorDetailHelper.searchDeclineVendor(
    vendorName.toLowerCase()
  );
  if (vendorData != null) {
    for (let i = 0; i < vendorData.length; i++) {
      let vendorDetailData =
        await vendorDetailHelper.findPendingVendorDetailByVendorId(
          vendorData[i]._id
        );

      let packageStatus = vendorDetailData.packageBought;
      let approvedPackage = vendorDetailData.approvedPackage;
      let vendorType = vendorDetailData.vendorType;

      if (approvedPackage == false) {
        finalResultArr.push({
          vendorResult: vendorData[i],
          packageStatus: packageStatus,
          approvedPackage: approvedPackage,
          vendorType: vendorType,
        });
      }
    }
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    finalResultArr
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Renew Vendor Subscription
//********************************************************************************
exports.renewVendorSubscription = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let packageId = request.packageId;
  let subscriptionPrice;
  let packageTime = request.packageTime; // 1 for monthly and 2 for yearly
  let cardNo = request.cardNo;
  let cardExpiryMonth;
  let cardExpiryYear;

  let packageDetail = await packageHelper.findPackage(packageId);
  let packageDbId = packageDetail._id;
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
    let vendorDetail = await userHelper.findUserById(vendorId);
    let vendorEmail = vendorDetail.email;
    let vendorName = vendorDetail.name;
    if (packageTime == 1) {
      subscriptionPrice = packageDetail.price;
    }
    if (packageTime == 2) {
      subscriptionPrice = parseInt(packageDetail.price) * 12;
    }

    let cardResult = await creditCardHelper.findCardByUserId(vendorId, cardNo);
    if (cardResult == null) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.CARD_NOT_FOUND
      );
      return res.status(response.code).json(response);
    }

    if (cardResult != null) {
      let cardExpiryDate = cardResult.expiryDate;
      let cardExpiryArr = cardExpiryDate.split("/");
      cardExpiryMonth = cardExpiryArr[0];
      cardExpiryYear = cardExpiryArr[1];
    }
    let stripeKey =
      "sk_test_51JrvHqDJQe8pXlZtGBtjPhRh1bF7K1T9Mjv9eoIx5m9zCJPAI8Fgpirziy3w1Ut7VQUqm5LtcJL1MJeNJ73Ru9GM007hoVHGWu";
    let adminStripeObj = {
      stripeKey: stripeKey.toString(),
      cardNo: request.cardNo,
      cardExpiryMonth: cardExpiryMonth,
      cardExpiryYear: cardExpiryYear,
      cardCvc: cardResult.cvvCode,
      totalAmount: subscriptionPrice * 100,
      vendorName: vendorName,
      vendorEmail: vendorEmail,
      currency: "usd",
      packageId: packageId,
      packageTime: packageTime,
    };
    let subscriptionExpiry;
    if (packageTime == 1) {
      subscriptionExpiry = moment().add(1, "months").format("YYYY-MM-DD");
    }
    if (packageTime == 2) {
      subscriptionExpiry = moment().add(12, "months").format("YYYY-MM-DD");
    }

    await vendorHelper.updateVendorSubscription(
      vendorId,
      packageDbId,
      subscriptionExpiry
    );
    try {
      await this.stripePayment(req, res, adminStripeObj);
      console.log("Success Stripe call");
    } catch (error) {
      console.log(error);
    }
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Vendor Subscription Detail - (for vendor)
//********************************************************************************
exports.vendorSubscriptionDetail = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.FORBIDDEN,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;
  // Vendor ID from Token
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
    let packageDetail = await packageHelper.findPackageById(
      vendorDetail.packageBought
    );
    let subscriptionDetail = {
      packageBought: packageDetail.packageId,
      packageExpiry: vendorDetail.packageExpiry,
    };
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      subscriptionDetail
    );

    return res.status(response.code).json(response);
  }
};

//**************  Use with in Vendor Controller  **************************************//

// check required fields
// for user
exports.signupRequiredFields = async (req, res) => {
  //if one of them is missing then not success
  if (!(req.name && req.email && req.password)) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  return true;
};
// for admin
exports.signupRequiredFieldsForAdmin = async (req, res) => {
  //if one of them is missing then not success
  if (!(req.name && req.email)) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  return true;
};

// Check User By ID
exports.checkId = async (request, res) => {
  if (!request.id) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
};

// Find User By ID
exports.findVendorById = async (request, res) => {
  let user = await vendorHelper.findVendorById({ id: request.id });
  if (user == null) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  return user;
};

// Check Page Size
exports.isPageNumber = async (request, res) => {
  if (!request.pageNo) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PAGE_NUMBER
    );
    return res.status(response.code).json(response);
  }
};
// stripe payment ///////////////////////////////////////////////////
exports.stripePayment = async (req, res, data) => {
  let stripeObj = {
    stripeKey: data.stripeKey,
    cardNo: data.cardNo,
    cardExpiryMonth: data.cardExpiryMonth,
    cardExpiryYear: data.cardExpiryYear,
    cardCvc: data.cardCvc,
    totalAmount: data.totalAmount,
    vendorName: data.vendorName,
    vendorEmail: data.vendorEmail,
    currency: data.currency,
    packageId: data.packageId,
    packageTime: data.packageTime,
  };
  let package;
  let packageDuration;
  if (data.packageId == 2) {
    package = "1";
  }
  if (data.packageId == 3) {
    package = "2";
  }
  if (data.packageTime == 1) {
    packageDuration = "Monthly";
  }
  if (data.packageTime == 2) {
    packageDuration = "Yearly";
  }
  let sCardNo = stripeObj.cardNo.toString();
  let errMessageStr;
  let response = responseHelper.getDefaultResponse();
  let stripeToken;
  let Secret_Key = stripeObj.stripeKey.toString();
  const stripe = require("stripe")(Secret_Key);
  await stripe.tokens
    .create({
      card: {
        number: sCardNo,
        exp_month: stripeObj.cardExpiryMonth,
        exp_year: stripeObj.cardExpiryYear,
        cvc: stripeObj.cardCvc.toString(),
      },
    })
    .then((result) => {
      stripeToken = result.id;
    })
    .catch((err) => {
      switch (err.type) {
        case "StripeCardError":
          // A declined card error,  invalid card detail
          errMessageStr = err.message;
        case "StripeRateLimitError":
          // Too many requests made to the API too quickly
          errMessageStr = err.message;
        case "StripeInvalidRequestError":
          // Invalid parameters were supplied to Stripe's API
          errMessageStr = err.message;
        case "StripeAPIError":
          // An error occurred internally with Stripe's API
          errMessageStr = err.message;
        case "StripeConnectionError":
          // Some kind of error occurred during the HTTPS communication
          errMessageStr = err.message;
        case "StripeAuthenticationError":
          // You probably used an incorrect API key
          errMessageStr = err.message;
        default:
          // Handle any other types of unexpected errors
          errMessageStr = err.message;
      }
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        errMessageStr
      );
      return res.status(response.code).json(response);
    });
  stripe.customers
    .create({
      email: stripeObj.vendorEmail,
      source: stripeToken,
      name: stripeObj.vendorName,
    })
    .then((customer) => {
      return stripe.charges.create({
        amount: stripeObj.totalAmount,
        description:
          stripeObj.vendorName +
          " (" +
          stripeObj.vendorEmail +
          ") - " +
          packageDuration +
          " Subscription of Package " +
          package,
        currency: stripeObj.currency,
        customer: customer.id,
      });
    })
    .then((charge) => {
      console.log("Success Payment");
      // console.log("wwww", charge);
      //   res.send("Success"); // If no error occurs
      // return charge;
    })
    .catch((err) => {
      //   res.send(err); // If some error occurs
      // console.log("EEEEEEEEEEEEEEE", err);
      // return err;
      console.log("Error Payment");
    });
};
