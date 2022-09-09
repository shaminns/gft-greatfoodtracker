// Helpers
const adminHelper = require("../Services/AdminHelper");
const responseHelper = require("../Services/ResponseHelper");
const userHelper = require("../Services/UserHelper");
const vendorHelper = require("../Services/VendorHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const credentialHelper = require("../Services/CredentialHelper");
const generalHelper = require("../Services/GeneralHelper");
const signupHelper = require("../Services/SignupHelper");
const packageHelper = require("../Services/PackageHelper");
// Model
const User = require("../Models/User");

// Middelwares
const TokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");
const Role = require("../Constants/Role.js");
const { ConnectionStates } = require("mongoose");

const signupResponseMessage = "Please undelete this";
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Role Change for Admin
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.changeRoleToAdmin = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  await userHelper.updateRoleForAdmin(request);
  let userData = await userHelper.findUserByEmail(request.email);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  response.userData = userData;
  return res.status(response.code).json(response);
};

//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Add Vendor by Admin api
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.saveVendorByAdmin = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let resultCheck;
  let role = "Vendor";
  // Check Required Signup Fields
  this.signupRequiredFieldsForAdmin(request, res);

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
      response.note = signupResponseMessage + " " + role.toLowerCase();
      response.isDeleted = userDeleted.isDeleted;
      return res.status(response.code).json(response);
    }
    // let emailWithNoSpace = email.replace(/ /g, "");
    let randomPassword = await generalHelper.getRandomPassword();
    let passwordEncryption = await generalHelper.bcryptPassword(randomPassword);
    let subject = process.env.ADMIN_SIGNUP_SUBJECT;
    message =
      process.env.ADMIN_SIGNUP_MESSAGE + randomPassword + process.env.THANK_YOU;

    await vendorHelper.saveRecord(
      request.name,
      role,
      email,
      passwordEncryption
    );

    signupHelper.sendEmail(randomPassword, email, subject, message);
    await userHelper.updateActivationStatus(email);
    let vendorDetail = await userHelper.findUserByEmail(email.toLowerCase());
    let vendorId = vendorDetail._id;
    await vendorDetailHelper.saveVendorDetail(request, vendorId);
    await userHelper.activateUser(email);
    // let packageDetail = await packageHelper.findPackage(1);
    // let packageId = packageDetail._id;

    // await vendorDetailHelper.setPackage(vendorId, packageId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Add User by Admin api
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.saveUserByAdmin = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let resultCheck;
  let role = "User";
  // Check Required Signup Fields
  this.signupRequiredFieldsForAdmin(request, res);

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
      response.note = signupResponseMessage + " " + role.toLowerCase();
      response.isDeleted = userDeleted.isDeleted;
      return res.status(response.code).json(response);
    }
    // let emailWithNoSpace = email.replace(/ /g, "");
    let randomPassword = await generalHelper.getRandomPassword();
    let passwordEncryption = await generalHelper.bcryptPassword(randomPassword);
    let subject = process.env.ADMIN_SIGNUP_SUBJECT;
    message =
      process.env.ADMIN_SIGNUP_MESSAGE + randomPassword + process.env.THANK_YOU;

    await vendorHelper.saveRecord(
      request.name,
      role,
      email,
      passwordEncryption
    );

    signupHelper.sendEmail(randomPassword, email, subject, message);
    console.log(randomPassword);
    await userHelper.activateUser(email);

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};

//********************************************************************************
// Delete Vendor by Admin api
//********************************************************************************
exports.deleteUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  // let userEmail = req.body.email;
  let emailArr = req.body.myData;
  for (let i = 0; i < emailArr.length; i++) {
    let user = await adminHelper.findUserByEmail(emailArr[i].email);
    if (user.role == "Admin") {
      response = responseHelper.setResponse(
        responseCode.NOT_AUTHORIZE,
        Message.ADMIN_ROLE
      );
      return res.status(response.code).json(response);
    }
    if (user.role != "Admin") {
      // Delete user
      await userHelper.deleteUser(emailArr[i].email);
    }
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.DELETE_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Un-Delete Vendor by Admin api
//********************************************************************************
exports.unDeleteUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  // let userEmail = req.body.email;
  let email = req.body.email;

  let user = await adminHelper.findUserByEmail(email);
  if (user.role == "Admin") {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.ADMIN_ROLE
    );
    return res.status(response.code).json(response);
  }
  if (user.role != "Admin") {
    // Delete user
    await userHelper.unDeleteUser(email);
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.UNDELETE_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Activate Vendor by Admin api
//********************************************************************************
exports.activatevendor = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorEmail = req.body.email;
  console.log(vendorEmail);

  // Activate Vendor
  await userHelper.activateUser(vendorEmail);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.ACTIVATE_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Approve/Disapprove Vendor Package by Admin api
//********************************************************************************
exports.approveVendorPackage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorEmail = req.body.email;
  let status = req.body.status;
  let vendorDetail = await userHelper.findUserByEmail(vendorEmail);
  let vendorId = vendorDetail._id;
  // // Activate/Deactivate Vendor
  // await userHelper.activateUser(vendorEmail);
  await vendorDetailHelper.approveVendorPackage(vendorId, status);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.ACTIVATE_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Activated Vendors List api
//********************************************************************************
exports.activatedVendorsList = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let result = await adminHelper.vendorActivatedList();
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Online Vendors List api
//********************************************************************************
exports.onlineVendorsList = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let result = await adminHelper.vendorOnlineList();
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Approved Subscription Vendors List api
//********************************************************************************
exports.approvedSubscriptionVendorsList = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let pageNo = req.body.pageNo;
  let result = await adminHelper.vendorApprovedSubscriptionList(pageNo);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Pending Subscription Vendors List api
//********************************************************************************
exports.pendingSubscriptionVendorsList = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let pageNo = req.body.pageNo;
  let finalResultArr = [];
  let result = await adminHelper.vendorPendingSubscriptionList(pageNo);
  for (let i = 0; i < result.data.length; i++) {
    let packageBought = result.data[i].packageBought;

    if (packageBought == null) {
      finalResultArr.push({
        vendorData: result.data[i],
      });
    }
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  response.pagination = result.pagination;
  response.finalResultArr = finalResultArr;
  return res.status(response.code).json(response);
};

//********************************************************************************
// Decline Vendors List api
//********************************************************************************
exports.declineVendorsList = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let pageNo = req.body.pageNo;
  let finalResultArr = [];
  let result = await adminHelper.vendorDeclineList(pageNo);

  for (let i = 0; i < result.data.length; i++) {
    // let approvedPackage = result.data[i].approvedPackage;
    // console.log(result.data[i]);
    if (result.data[i].vendorId.isDeleted == false) {
      finalResultArr.push({
        vendorData: result.data[i],
      });
    }
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  response.pagination = result.pagination;
  response.finalResultArr = finalResultArr;
  return res.status(response.code).json(response);
};

//********************************************************************************
// All User List List api
//********************************************************************************
exports.allUserList = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let result = await adminHelper.usersList();
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Set Vendor's Online/Offline Status (for admin)
//********************************************************************************
exports.setOnlineForAdmin = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let vendorId = request._id;

  await vendorDetailHelper.setOnlineStatus(vendorId, request);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//**************  Use with in Admin Controller  ********************************//

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
