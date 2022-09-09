const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment");

// Helpers
const userHelper = require("../Services/UserHelper");
const vendorHelper = require("../Services/VendorHelper");
const responseHelper = require("../Services/ResponseHelper");
const generalHelper = require("../Services/GeneralHelper");
const menuHelper = require("../Services/MenuHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const orderHelper = require("../Services/OrderHelper");
const creditCardHelper = require("../Services/CreditCardHelper");

const credentialHelper = require("../Services/CredentialHelper");
const signupHelper = require("../Services/SignupHelper");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");

//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// New Signup
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.collectData = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let resultCheck;
  let vendorPassword = request.password;
  let token = null;
  let userRole = null;
  let result;

  // Check Required Signup Fields
  this.signupRequiredFields(request, res);
  // Password Check..
  if (vendorPassword) {
    resultCheck = credentialHelper.passwordCheck(vendorPassword);

    if (resultCheck === false) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_PASSWORD
      );
      return res.status(response.code).json(response);
    }
  }
  // }

  // Signup Email Check
  if (req.body.email) {
    resultCheck = credentialHelper.emailCheck(req.body.email);
    if (resultCheck === false) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_EMAIL
      );
      return res.status(response.code).json(response);
    }

    //check user exist
    let email = req.body.email.toLowerCase();
    let user = await userHelper.findUserByEmail(email);
    if (user != null) {
      let response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.EMAIL_EXIST
      );
      return res.status(response.code).json(response);
    }
    //check user exist but (soft) deleted

    let userDeleted = await userHelper.findUserByEmailForSignup(email);
    if (userDeleted != null) {
      let response = responseHelper.setResponse(
        responseCode.NOT_AUTHORIZE,
        Message.EMAIL_EXIST
      );
      response.signupMessage =
        "Account Blocked/Suspended. Please contact administrator";
      response.isDeleted = userDeleted.isDeleted;
      return res.status(response.code).json(response);
    }
    let randomActivationCode = await generalHelper.getRandomCode();
    let subject = process.env.OTP_SUBJECT;
    let message =
      process.env.OTP_MESSAGE + randomActivationCode + process.env.THANK_YOU;

    await signupHelper.sendEmail(randomActivationCode, email, subject, message);
    let actCode = randomActivationCode;

    result = req.body;

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    response.actCode = actCode;
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Send OTP (for forget password request)
//********************************************************************************
// exports.sendOtp = async (req, res) => {
//   let userEmail = req.body.email.toLowerCase();
//   let randomActivationCode = await generalHelper.getRandomCode();
//   let subject = process.env.OPT_SUBJECT;
//   let message =
//     process.env.OTP_MESSAGE + randomActivationCode + process.env.THANK_YOU;

//   signupHelper.sendEmail(randomActivationCode, userEmail, subject, message);
//   let result = randomActivationCode;
//   let response = responseHelper.setResponse(
//     responseCode.SUCCESS,
//     Message.REQUEST_SUCCESSFUL,
//     result
//   );
//   return res.status(response.code).json(response);
// };

//********************************************************************************
// Login api
//********************************************************************************

exports.login = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let userEmail = req.body.email.toLowerCase();
  let userPassword = req.body.password;
  let user = await userHelper.findBlockUser(userEmail); // find user without isDeleted

  // Check Email and Password Entered
  if (!(req.body.email && req.body.password)) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_EMAIL_OR_PASSWORD
    );
    return res.status(response.code).json(response);
  }

  // Validate Email Pattern
  let result = credentialHelper.emailCheck(userEmail);

  if (result == false) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.INVALID_EMAIL
    );
    return res.status(response.code).json(response);
  }

  // Check Email Exist
  // let user = await userHelper.findUserByEmail(userEmail);

  if (user == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.USER_NOT_EXIST
    );
    return res.status(response.code).json(response);
  }

  // Processing for Login
  bcrypt.compare(userPassword, user.password, async (err, result) => {
    if (err) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_PASSWORD
      );
      return res.status(response.code).json(response);
    }

    if (!result) {
      response = await responseHelper.setResponse(
        responseCode.FORBIDDEN,
        Message.WRONG_PASSWORD
      );
      return res.status(response.code).json(response);
    }
    if (result) {
      const token = jwt.sign(
        {
          email: user.email,
          id: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "8766h",
        }
      );
      let result = {
        _id: user.id,
        role: user.role,
        email: user.email,
        user_detail: user.name,
      };
      let vendorData = await userHelper.findBlockUser(user.email); //find vendor deatil without isDeleted

      let vendorId = vendorData._id;
      let vendorDetailData =
        await vendorDetailHelper.findVendorDetailByVendorId(vendorId);
      let vendorPackage;
      let vendorPackageApproval;
      if (user.role == "Vendor") {
        vendorPackage = vendorDetailData.packageBought;
        vendorPackageApproval = vendorDetailData.approvedPackage;
      }

      if (user.role == "Vendor" && vendorPackage == null) {
        let approved = vendorPackageApproval;
        let package = vendorPackage;
        response = await responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.PACKAGE_ERROR,
          result
        );
        response.package = package;
        response.approved = approved;
        return res.status(response.code).json(response);
      }
      if (user.role == "Vendor" && vendorPackageApproval == false) {
        let approved = vendorPackageApproval;
        let package = vendorPackage;
        response = await responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.PACKAGE_NOT_APPROVED,
          result
        );
        response.package = package;
        response.approved = approved;
        return res.status(response.code).json(response);
      }
      if (user.role == "Vendor" && vendorPackageApproval == true) {
        let approved = true;
        let package = true;
        result["venderDetail"] = vendorDetailData;
        console.log("vendor check");
        await userHelper.updateDeviceTokenOfOtherUsers(request.deviceToken);
        await userHelper.updateDeviceToken(request.email, request.deviceToken);
        let userDetailForToken = await userHelper.findBlockUser(
          //find user by email
          request.email
        );
        console.log(userDetailForToken.deviceToken);
        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.LOGIN_SUCCESS,
          result
        );
        response["venderDetailFlag"] = vendorDetailData?.searchTag?.length > 0;
        response["coverImageFlag"] =
          vendorDetailData?.coverImage !== "default.jpg";
        response["profileImageFlag"] = user?.profileImage !== "default.jpg";
        response["Location"] = user?.latitude !== 0 && user?.longitude !== 0;
        response.package = package;
        response.approved = approved;
        response.token = token;
        response.deviceToken = userDetailForToken.deviceToken;
        return res.status(response.code).json(response);
      }
      console.log("login");
      await userHelper.updateDeviceToken(request.email, request.deviceToken);
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.LOGIN_SUCCESS,
        result
      );

      let userDetailForToken = await userHelper.findUserByEmail(request.email);
      response.isDeleted = user.isDeleted;
      //Only for Login api
      response.token = token;
      response.deviceToken = userDetailForToken.deviceToken;
      return res.status(response.code).json(response);
    }
  });
};
//********************************************************************************
// Send Code for Forget Password api
//********************************************************************************
exports.forgotpasswordcode = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

  let userEmail = req.body.email.toLowerCase();
  // Check Email Exist
  let user = await userHelper.findUserByEmail(userEmail);

  if (user == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.EMAIL_NOT_EXIST
    );
    return res.status(response.code).json(response);
  }

  let randomActivationCode = await generalHelper.getRandomCode();
  let result = randomActivationCode;
  let subject = process.env.PASSWORD_RESET_SUBJECT;
  let message = process.env.PASSWORD_RESET_MESSAGE + randomActivationCode + ".";
  await userHelper.setForgotCode(userEmail, randomActivationCode);
  signupHelper.sendEmail(randomActivationCode, userEmail, subject, message);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.EMAIL_RECEIVED_SHORTLY,
    result
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// Update Forget Password api
//********************************************************************************
exports.forgotpassword = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let userEmail = req.body.email;
  let userPassword = req.body.userPassword;
  let confirmUserPassword = req.body.confirmUserPassword;
  // Password Check..
  result = credentialHelper.passwordCheck(req.body.userPassword);
  let result1 = credentialHelper.passwordCheck(req.body.confirmUserPassword);

  if (result === false || result1 === false) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.INVALID_PASSWORD
    );
    return res.status(response.code).json(response);
  }
  // Bcrypt Matched New Passwords
  if (userPassword === confirmUserPassword) {
    let bcryptPassword = await generalHelper.bcryptPassword(
      confirmUserPassword
    );

    let user = await userHelper.findUserByEmail(userEmail);
    await userHelper.updateForgotPassword(req.body, bcryptPassword); //req.body.email

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.UPDATE_SUCCESS
    );
    return res.status(response.code).json(response);
  }

  response = responseHelper.setResponse(
    responseCode.NOT_SUCCESS,
    Message.PASSWORD_NOT_MATCH
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Reset Password api
//********************************************************************************
exports.resetpassword = async (req, res, next) => {
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

  let userId = await tokenExtractor.getInfoFromToken(token);

  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let userPassword = req.body.userPassword;
    let confirmUserPassword = req.body.confirmUserPassword;

    let oldPassword = req.body.password;
    let user = await userHelper.findUserById(userId);

    // Password Check..
    let result2 = await credentialHelper.passwordCheck(req.body.userPassword);
    let result1 = await credentialHelper.passwordCheck(
      req.body.confirmUserPassword
    );

    if (result2 === false || result1 === false) {
      response = await responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_PASSWORD
      );
      return res.status(response.code).json(response);
    }

    await bcrypt.compare(oldPassword, user.password, async (err, isMatch) => {
      if (!isMatch) {
        response = await responseHelper.setResponse(
          responseCode.FORBIDDEN,
          Message.WRONG_OLD_PASSWORD
        );
        return res.status(response.code).json(response);
      }

      // Match Passwords and Bcrypt
      if (userPassword != confirmUserPassword) {
        response = await responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.PASSWORD_NOT_MATCH
        );
        return res.status(response.code).json(response);
      }
      //Check Old Password and New Password Not Same
      if (oldPassword == userPassword) {
        response = await responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.OLD_NEW_PASSWORD_SAME
        );
        return res.status(response.code).json(response);
      }
      if (userPassword == confirmUserPassword) {
        let bcryptPassword = await generalHelper.bcryptPassword(
          confirmUserPassword
        );

        await userHelper.updateResetPassword(userId, bcryptPassword);

        response = await responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.UPDATE_SUCCESS
        );
        return res.status(response.code).json(response);
      }
    });
  }
};
//********************************************************************************
// Set (add) Location api
//********************************************************************************
exports.setLocation = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  // Get Token
  let token = req.headers.authorization;
  // User ID from Token
  let userId = await tokenExtractor.getInfoFromToken(token);
  // Update Location
  await userHelper.updateUserLoc(userId, req.body);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.LOCATION_UPDATE_SUCCESS
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Get Location api
//********************************************************************************
exports.getLocation = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  // Get Token
  let token = req.headers.authorization;
  // User ID from Token
  let userId = await tokenExtractor.getInfoFromToken(token);
  // Get Location
  let user = await userHelper.findUserById(userId, req.body);
  let result = {
    latitude: user.latitude,
    longitude: user.longitude,
  };
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Get Vendors Location List & Current User Location api
//********************************************************************************
exports.getUserList = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorDetailArr = [];
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
  // Get Location
  let user = await userHelper.findUserById(userId, req.body);
  if (user == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  let location = {
    latitude: user.latitude,
    longitude: user.longitude,
  };
  let isFavourite;
  let vendorDetailRecord = await vendorDetailHelper.allVendorLocationDetail();

  // let openTime = vendorDetailRecord[0].servingHours.openTime;
  // let closeTime = vendorDetailRecord[0].servingHours.closeTime;
  // let openCloseStatus;

  // var format = "HH:mm";
  // var time = moment(); //gives you current time. no format required.
  // //var time = moment("00:45", format),
  // (beforeTime = moment(openTime, format)),
  //   (afterTime = moment(closeTime, format));
  // if (time.isBetween(beforeTime, afterTime)) {
  //   openCloseStatus = "Open";
  // } else {
  //   openCloseStatus = "Close";
  // }
  // console.log(openCloseStatus);
  let favoriteResult = await userHelper.favouriteVendorsArray(userId);
  let idArray = [];
  for (let j = 0; j < vendorDetailRecord.length; j++) {
    if (vendorDetailRecord[j].vendorId) {
      idArray.push(vendorDetailRecord[j].vendorId._id);
    }
  }

  for (let i = 0; i < vendorDetailRecord.length; i++) {
    isFavourite = favoriteResult.favouriteStatus.includes(idArray[i]);
    let vendorId = vendorDetailRecord[i].vendorId;
    let rating = await userHelper.getRating(vendorId);
    vendorDetailArr.push({
      vendorDetail: vendorDetailRecord[i],
      rating: rating,
      isFavourite: isFavourite,
    });
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  response.vendorRecord = vendorDetailArr;
  response.userLocation = location;
  return res.status(response.code).json(response);
};

//********************************************************************************
// Filter
//********************************************************************************
exports.gftfilter = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let arr = [];
  var obj = req.body;

  // Get Value against key (for search and filter)
  Object.prototype.getKey = function (value) {
    for (var key in this) {
      if (this[key] == value) {
        arr.push(key);
      }
    }
    return null;
  };

  obj.getKey(true);

  let openCloseStatus;
  let finalResultArr = [];
  if (arr.length == 0) {
    result = await vendorHelper.searchAll();
    for (let i = 0; i < result.length; i++) {
      let openTime = result[i].servingHours.openTime;
      let closeTime = result[i].servingHours.closeTime;
      var format = "HH:mm";
      var time = moment();
      (beforeTime = moment(openTime, format)),
        (afterTime = moment(closeTime, format));
      if (time.isBetween(beforeTime, afterTime)) {
        openCloseStatus = "Open";
      } else {
        openCloseStatus = "Close";
      }
      finalResultArr.push({
        result: result[i],
        openCloseStatus: openCloseStatus,
      });
    }

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      finalResultArr
    );
    return res.status(response.code).json(response);
  }
  if (arr.length != 0) {
    result = await vendorHelper.filterSearch(arr);

    for (let i = 0; i < result.length; i++) {
      let openTime = result[i].servingHours.openTime;
      let closeTime = result[i].servingHours.closeTime;
      var format = "HH:mm";
      var time = moment();
      (beforeTime = moment(openTime, format)),
        (afterTime = moment(closeTime, format));
      if (time.isBetween(beforeTime, afterTime)) {
        openCloseStatus = "Open";
      } else {
        openCloseStatus = "Close";
      }
      finalResultArr.push({
        result: result[i],
        openCloseStatus: openCloseStatus,
      });
    }

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      finalResultArr
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Search By Menu Item api
//********************************************************************************
exports.gftSearch = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  var title = req.body.title;
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
    if (!title) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.MISSING_PARAMETER
      );
      return res.status(response.code).json(response);
    }
    if (title) {
      let isFavourite;
      let menuDistinctArr = [];
      let finalMenuDetailArr = [];
      let finalArray = [];
      let searchResult = await menuHelper.findMenuItemByTitle(title);
      for (let i = 0; i < searchResult.length; i++) {
        let menuId = searchResult[i]._id;
        let vendorId = searchResult[i].vendorId._id;
        let userIsDeletedCheck = await userHelper.findUserById(vendorId);
        let vendorOnlineCheck =
          await vendorDetailHelper.findVendorDetailByVendorId(vendorId);

        if (
          userIsDeletedCheck.isDeleted == false &&
          vendorOnlineCheck.isOnline == true
        ) {
          console.log("chk", userIsDeletedCheck);
          menuDistinctArr.push({
            menuId: menuId,
            vendorId: vendorId,
          });
        }
      }
      const key = "vendorId";
      const menuArrayUniqueByKey = [
        ...new Map(menuDistinctArr.map((item) => [item[key], item])).values(),
      ];
      for (let j = 0; j < menuArrayUniqueByKey.length; j++) {
        let menuDetail = await menuHelper.findMenuByMenuIdAndVendorId(
          menuArrayUniqueByKey[j].menuId,
          menuArrayUniqueByKey[j].vendorId
        );
        finalMenuDetailArr.push(menuDetail);
      }
      let favoriteResult = await userHelper.favouriteVendorsArray(userId);
      let idArray = [];
      for (let j = 0; j < finalMenuDetailArr.length; j++) {
        if (finalMenuDetailArr[j].vendorId) {
          idArray.push(finalMenuDetailArr[j].vendorId.toString());
        }
      }

      for (let i = 0; i < idArray.length; i++) {
        isFavourite = favoriteResult.favouriteStatus.includes(idArray[i]);
        let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
          finalMenuDetailArr[i].vendorId
        );
        let vendorBasicDetail = await userHelper.findUserById(
          finalMenuDetailArr[i].vendorId
        );
        let openTime = vendorDetail.servingHours.openTime;
        let closeTime = vendorDetail.servingHours.closeTime;
        let vendorTime;

        var format = "HH:mm";
        var time = moment();
        (beforeTime = moment(openTime, format)),
          (afterTime = moment(closeTime, format));
        if (time.isBetween(beforeTime, afterTime)) {
          vendorTime = "Open";
        } else {
          vendorTime = "Close";
        }
        finalArray.push({
          searchResult: finalMenuDetailArr[i],
          isFavourite: isFavourite,
          coverImage: vendorDetail.coverImage,
          vendorTimeStatus: vendorTime,
          name: vendorBasicDetail.name,
          latitude: vendorBasicDetail.latitude,
          longitude: vendorBasicDetail.longitude,
        });
      }

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      response.finalArray = finalArray;
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Search By Resturant Name api
//********************************************************************************
exports.gftResturantSearch = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  var request = req.body;
  var restaurantArr = [];

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
    let isFavourite;
    let searchResult = await vendorHelper.findVendorByName(request);

    let favoriteResult = await userHelper.favouriteVendorsArray(userId);
    let idArray = [];
    for (let j = 0; j < searchResult.length; j++) {
      idArray.push(searchResult[j]._id.toString());
    }
    for (let i = 0; i < searchResult.length; i++) {
      let vendorId = searchResult[i]._id;
      let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
        vendorId
      );
      if (vendorDetail != null && vendorDetail.isOnline == true) {
        // check
        let vendorCover = vendorDetail.coverImage;
        let openTime = vendorDetail.servingHours.openTime;
        let closeTime = vendorDetail.servingHours.closeTime;
        let vendorTime;

        var format = "HH:mm";
        var time = moment(); //gives you current time. no format required.
        //var time = moment("00:45", format),
        (beforeTime = moment(openTime, format)),
          (afterTime = moment(closeTime, format));
        if (time.isBetween(beforeTime, afterTime)) {
          vendorTime = "Open";
        } else {
          vendorTime = "Close";
        }
        isFavourite = favoriteResult.favouriteStatus.includes(idArray[i]);
        restaurantArr.push({
          vendorDetail: searchResult[i],
          vendorTimeStatus: vendorTime,
          coverImage: vendorCover,
          isFavourite: isFavourite,
        });
      }
    }
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.restaurantDetail = restaurantArr;
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// Resturant Names (for search box) api
//********************************************************************************
exports.gftResturantSearchForSearchBox = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vendorArr = [];
  let result = await vendorHelper.findVendorByNameForSearchBox();
  for (let i = 0; i < result.length; i++) {
    vendorArr.push({ name: result[i].vendorId.name });
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    vendorArr
  );
  return res.status(response.code).json(response);
};

//********************************************************************************
// Set Rating api
//********************************************************************************
exports.setRating = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let orderRating;
  if (request.rating == "close") {
    orderRating = 2;
  }
  if (request.rating == "false") {
    orderRating = 0;
  }
  if (request.rating == "true") {
    orderRating = 1;
  }
  await orderHelper.setOrderRating(request, orderRating);
  if (orderRating == 1 || orderRating == 0) {
    await userHelper.setRating(request, orderRating);
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Get Rating api
//********************************************************************************
exports.getRating = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let vebdorId = req.body.vendorId;
  let ratingCount = 0;
  let userRatingData = await userHelper.getRating(vebdorId);
  for (let i = 0; i < userRatingData.rating.length; i++) {
    if (userRatingData.rating[i] == 1) {
      ratingCount++;
    }
  }
  let ratingDivider;
  let totalRatingCount = userRatingData.rating.length;
  if (totalRatingCount == 0) {
    ratingDivider = 1;
  }
  if (totalRatingCount > 0) {
    ratingDivider = totalRatingCount;
  }
  let userRating = (ratingCount / ratingDivider) * process.env.RATING_LIMIT;
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    userRating.toFixed(1)
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Search By Vendor's Location api
//********************************************************************************
exports.gftLocationSearch = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let latitude = request.latitude;
  let longitude = request.longitude;
  // if (!(latitude && longitude)) {
  //   response = responseHelper.setResponse(
  //     responseCode.NOT_SUCCESS,
  //     Message.MISSING_PARAMETER
  //   );
  //   return res.status(response.code).json(response);
  // }
  // if (latitude && longitude) {
  let result = await vendorHelper.findVendorByLocation(request);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
  // }
};
//********************************************************************************
// Filter
//********************************************************************************
exports.filterSearch = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let arr = [];
  var obj = req.body;

  // Get Value against key (for search and filter)
  Object.prototype.getKey = function (value) {
    for (var key in this) {
      if (this[key] == value) {
        arr.push(key);
      }
    }
    return null;
  };

  obj.getKey(true);

  if (arr.length == 0) {
    result = await vendorHelper.searchAll();

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
  if (arr.length != 0) {
    result = await vendorHelper.filterSearch(arr);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Check User/Vendor is Block
//********************************************************************************
exports.isBlock = async (req, res) => {
  let response = responseHelper.getDefaultResponse();

  let userDetail = await userHelper.findBlockUser(req.body.email);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  response.block = userDetail.isDeleted;
  return res.status(response.code).json(response);
};
//********************************************************************************
// Delete Device Token
//********************************************************************************
exports.deleteDeviceToken = async (req, res) => {
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
    await userHelper.deleteDeviceToken(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Show Credit Card (for update)
//********************************************************************************
exports.showCreditCard = async (req, res) => {
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
    let result = await creditCardHelper.findCardByUserIdAndCardNo(
      userId,
      request.cardNo
    );
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Update Credit Card
//********************************************************************************
exports.updateCreditCard = async (req, res) => {
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
    let result = await creditCardHelper.updateCreditCardByUserIdAndCardNo(
      userId,
      request
    );
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Update Device Token
//********************************************************************************
exports.updateDeviceToken = async (req, res) => {
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
    let userDetail = await userHelper.findUserById(userId);
    let userEmail = userDetail.email;
    await userHelper.updateDeviceToken(userEmail, request.deviceToken);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Hardcode Delete User - for developer back-end
//********************************************************************************
exports.backEndDeleteUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  //check user exist
  let email = req.body.email.toLowerCase();
  let user = await userHelper.findUserByEmail(email);
  if (user == null) {
    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.EMAIL_NOT_EXIST
    );
    return res.status(response.code).json(response);
  }
  if (user != null) {
    // Delete user
    await userHelper.hardCodeDeleteUser(email);
    if (user.role == "Vendor") {
      await userHelper.hardCodeDeleteVendorDetail(user._id);
    }

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.UNDELETE_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};

//**************  Use with in General Controller  ********************************//

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
