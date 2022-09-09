const jwt = require("jsonwebtoken");
const fs = require("fs");

// Helpers
const userHelper = require("../Services/UserHelper");
const responseHelper = require("../Services/ResponseHelper");
const generalHelper = require("../Services/GeneralHelper");
const vendorHelper = require("../Services/VendorHelper");
const packageHelper = require("../Services/PackageHelper");
const orderHelper = require("../Services/OrderHelper");

const credentialHelper = require("../Services/CredentialHelper");
// Model
const User = require("../Models/User");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");
const mongoose = require("mongoose");

//********************************************************************************
// Save Record (User)
//********************************************************************************
exports.saveRecord = async (req, res) => {
  let request = req.body;
  console.log(request.password);
  let passwordEncryption = await generalHelper.bcryptPassword(request.password);
  let role = "User";
  let result;

  await userHelper.saveRecord(
    request.name,
    role,
    request.email.toLowerCase(),
    passwordEncryption
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
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REGISTER_SUCCESS,
    result
  );
  response.token = token;
  return res.status(response.code).json(response);
};

//********************************************************************************
// Update user api
//********************************************************************************
exports.updateUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let userEmail = req.body.email;
  let userId;

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
  userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  let userRole = await tokenExtractor.getRoleFromToken(token);

  if (userRole == "Admin") {
    if (!userEmail) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.EMAIL_REQUIRED
      );
      return res.status(response.code).json(response);
    }
    let user = await userHelper.findUserByEmail(userEmail);

    if (user == null) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.USER_NOT_EXIST
      );
      return res.status(response.code).json(response);
    }

    userId = user._id;

    if (user != null) {
      await userHelper.updateUserAllInfo(userId, req.body);
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
  if (userRole != "Admin") {
    // User ID from Token
    userId = await tokenExtractor.getInfoFromToken(token);
  }

  let userRoleFromToken = await tokenExtractor.getRoleFromToken(token);

  if (userRoleFromToken == "Vendor") {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.ROLE_NOT_ALLOWED
    );
    return res.status(response.code).json(response);
  }

  if (userRoleFromToken == "User" && userId != null) {
    // Update User Name and Image
    await userHelper.updateUserAllInfo(userId, req.body);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.UPDATE_SUCCESS
    );
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// Set/Update Location api
//********************************************************************************
exports.updatelocation = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  // Get Token
  let token = req.headers.authorization;
  // User ID from Token
  let userId = await tokenExtractor.getInfoFromToken(token);
  // Update Location
  await userHelper.updateUserAllInfo(userId, req.body);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.LOCATION_UPDATE_SUCCESS
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// View All User List api
//********************************************************************************
exports.findAllUsers = async (req, res, next) => {
  let request = req.body;
  let userRole = "User";
  let pageNo = req.body.pageNo;
  let finalDataArr = [];
  this.isPageNumber(request, res);
  let result = await userHelper.findAllUsers(pageNo, userRole);
  for (let i = 0; i < result.data.length; i++) {
    let userData = result.data[i];
    let orderResult = await orderHelper.userPastMyOrders(result.data[i]._id, [
      process.env.COMPLETED_ORDER,
      process.env.DELIVERED_ORDER,
    ]);
    let totalOrders = orderResult.length;
    finalDataArr.push({ userDetail: userData, totalOrders: totalOrders });
  }
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result.pagination
  );
  response.data = finalDataArr;
  return res.status(response.code).json(response);
};
//********************************************************************************
// Search User By Name
//********************************************************************************
exports.searchUserByName = async (req, res, next) => {
  let request = req.body;
  let userName = request.name;
  let userRole = "User";
  let finalDataArr = [];
  let result = await userHelper.getUsersByName(
    userRole,
    userName.toLowerCase()
  );
  console.log(result);
  for (let i = 0; i < result.length; i++) {
    let userData = result[i];
    let orderResult = await orderHelper.userPastMyOrders(result[i]._id, [
      process.env.COMPLETED_ORDER,
      process.env.DELIVERED_ORDER,
    ]);
    let totalOrders = orderResult.length;
    finalDataArr.push({ userDetail: userData, totalOrders: totalOrders });
  }
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result.pagination
  );
  response.data = finalDataArr;
  return res.status(response.code).json(response);
};
//********************************************************************************
// Add to Favourite api
//********************************************************************************
exports.addFavouriteVendor = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;

  // User ID from Token
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (!vendorId) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  if (vendorId) {
    let favStatus = await userHelper.findAlreadyFavourite(userId, vendorId);

    if (favStatus != 0) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.ALREADY_EXIST
      );
      return res.status(response.code).json(response);
    }
    if (favStatus == 0) {
      vendorId = mongoose.Types.ObjectId(vendorId);
      await userHelper.addFavouriteVendor(userId, vendorId);
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Delete from Favourite api
//********************************************************************************
exports.deleteFavouriteVendor = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  // Get Token
  let token = req.headers.authorization;

  // User ID from Token
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (!vendorId) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  if (vendorId) {
    let favStatus = await userHelper.findAlreadyFavourite(userId, vendorId);

    if (favStatus == null) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.NOT_EXIST
      );
      return res.status(response.code).json(response);
    }
    if (favStatus != null) {
      await userHelper.deleteFavouriteVendor(userId, vendorId);
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Update User Profile Image api
//********************************************************************************
exports.updateUserProfileImage = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    fs.unlinkSync(imagePath);
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let userDetail = await userHelper.findUserById(userId);

    let previousProfileImage = userDetail.profileImage;
    if (previousProfileImage == "default.jpg") {
      await userHelper.addProfileImage(userId, imagePath);

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
    if (previousProfileImage != "default.jpg") {
      fs.unlinkSync(previousProfileImage);
      await userHelper.addProfileImage(userId, imagePath);

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Add/Update Account Detail api
//********************************************************************************
exports.addUpdateAccountDetail = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (userId != null) {
    if (
      !(
        request.bankName &&
        request.accountHolderName &&
        request.accountNumber &&
        request.confirmAccountNumber
      )
    ) {
      let response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.MISSING_PARAMETER
      );
      return res.status(response.code).json(response);
    }

    let accountNumber = credentialHelper.accountNumberCheck(
      request.accountNumber
    );
    let confirmAccountNumber = credentialHelper.accountNumberCheck(
      request.confirmAccountNumber
    );
    if (accountNumber == false) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_ACCOUNT_NUMBER
      );
      return res.status(response.code).json(response);
    }

    if (
      request.bankName &&
      request.accountHolderName &&
      request.accountNumber &&
      request.confirmAccountNumber
    ) {
      if (request.accountNumber != request.confirmAccountNumber) {
        await userHelper.addUpdateBankDetail(userId, request);
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.SAME_ACCOUNT_ERROR
        );
        return res.status(response.code).json(response);
      }
      if (request.accountNumber == request.confirmAccountNumber) {
        await userHelper.addUpdateBankDetail(userId, request);
        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.REQUEST_SUCCESSFUL
        );
        return res.status(response.code).json(response);
      }
    }
  }
};

//********************************************************************************
// Show User's Basic Info api - (for update)
//********************************************************************************
exports.showUserBasicInfo = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (userId != null) {
    let result = await userHelper.findUserById(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Show Favorite (subscriber) List (for users) api
//********************************************************************************
exports.showFavoriteForUser = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (userId != null) {
    let result = await userHelper.showFavorite(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// Get Vendor Detail api - (for user)
//********************************************************************************
exports.getVendorDetailForUser = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  let isFavourite;
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (userId != null) {
    let favoriteResult = await userHelper.favouriteVendorsArray(userId);
    isFavourite = favoriteResult.favouriteStatus.includes(vendorId);

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
      response.isFavourite = isFavourite;
      return res.status(response.code).json(response);
    }
  }
};

//********************************************************************************
// Update Stripe Detail api - (for vendor)
//********************************************************************************
exports.updateStripeDetail = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let stripePublicKey = request.stripePublicKey;
  let stripeSecretKey = request.stripeSecretKey;
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
    await userHelper.updateStripeDetail(
      vendorId,
      stripePublicKey,
      stripeSecretKey
    );
    let vendorRecord = await userHelper.findUserById(vendorId);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.stripePublicKey = vendorRecord.stripeDetail.publicKey;
    response.stripeSecretKey = vendorRecord.stripeDetail.secretKey;
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// Check is Apple User
//********************************************************************************
exports.checkAppleUser = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  let checkIsAppleUser = await userHelper.isAppleUser();
  let result = { isAppleUser: checkIsAppleUser.isAppleUser };

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Update Apple User Status
//********************************************************************************
exports.updateAppleUser = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let checkIsAppleUser = await userHelper.isAppleUser();
  if (checkIsAppleUser == null) {
    await userHelper.createEntryIsAppleUser();
  } else {
    await userHelper.updatAppleUser(request.status);
  }
  let appleUserCheck = await userHelper.isAppleUser();
  let result = { isAppleUser: appleUserCheck.isAppleUser };

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );

  return res.status(response.code).json(response);
};
//**************  Use with in User Controller  **************************************//

//check required fields
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
exports.findUserById = async (request, res) => {
  let user = await userHelper.findUserById({ id: request.id });
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
