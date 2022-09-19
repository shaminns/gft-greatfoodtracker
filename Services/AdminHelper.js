const moment = require("moment");
const fs = require("fs");

//Mongoose
const mongoose = require("mongoose");

//Models
const User = require("../Models/User");
const VendorDetail = require("../Models/VenderDetail");
const Order = require("../Models/Order");

//Constant
const Role = require("../Constants/Role");

//Helpers
const GeneralHelper = require("./GeneralHelper");
const SignupHelper = require("./SignupHelper");
const userHelper = require("../Services/UserHelper");

exports.findUserById = async (_id) => {
  return await User.findOne({ _id: _id });
};

exports.findUserByEmail = async (email) => {
  return User.findOne({ email: email });
};

exports.vendorActivatedList = async () => {
  let vendorDetailArray = [];
  let finalDataArray = [];
  let userDetail = await User.find(
    { isActivated: true, role: "Vendor" },
    { name: 1, email: 1 }
  );

  for (let i = 0; i < userDetail.length; i++) {
    let vendorId = userDetail[i]._id;
    let vendorDetailData = await VendorDetail.findOne(
      { vendorId: vendorId, role: "Vendor" },
      { phoneNumber: 1, vendorType: 1, isOnline: 1, _id: 0 }
    );
    vendorDetailArray.push(vendorDetailData);
  }
  for (let j = 0; j < userDetail.length; j++) {
    finalDataArray.push({
      vendorData: userDetail[j],
      vendorDetail: vendorDetailArray[j],
    });
  }

  return finalDataArray;
};

exports.vendorOnlineList = async () => {
  return await VendorDetail.find(
    { isOnline: true, role: "Vendor" },
    { isOnline: 1, phoneNumber: 1, vendorType: 1, _id: 0 }
  ).populate("vendorId", "name email");
};
exports.vendorApprovedSubscriptionList = async (pageNo) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  let userCondition = [{ approvedPackage: true }];

  // { isOnline: 1, phoneNumber: 1, vendorType: 1 },
  let searchValue = null;
  if (GeneralHelper.isValueSet(searchValue)) {
    searchValue = GeneralHelper.escapeLike(searchValue);
    let regex = new RegExp(searchValue, "i");

    // userCondition.push({
    //   $or: [{ "detail.name": { $regex: regex } }, { email: { $regex: regex } }],
    // });
  }
  userCondition = { $and: userCondition };
  let result = await VendorDetail.find(userCondition, {
    isOnline: 1,
    phoneNumber: 1,
    vendorType: 1,
    servingHours: 1,
    approvedPackage: 1,
  })
    .populate("vendorId", "name email address isDeleted")
    .sort({ createdAt: 1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await VendorDetail.find(userCondition).countDocuments();

  return {
    pagination: GeneralHelper.makePaginationObject(
      pg.pageNo,
      pg.pageSize,
      pg.skip,
      total,
      result.length
    ),
    data: result,
  };
};
exports.vendorPendingSubscriptionList = async (pageNo) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  let userCondition = [{ approvedPackage: null }];

  // { isOnline: 1, phoneNumber: 1, vendorType: 1 },
  let searchValue = null;
  if (GeneralHelper.isValueSet(searchValue)) {
    searchValue = GeneralHelper.escapeLike(searchValue);
    let regex = new RegExp(searchValue, "i");

    // userCondition.push({
    //   $or: [{ "detail.name": { $regex: regex } }, { email: { $regex: regex } }],
    // });
  }
  userCondition = { $and: userCondition };
  let result = await VendorDetail.find(userCondition, {
    isOnline: 1,
    phoneNumber: 1,
    vendorType: 1,
    packageBought: 1,
    approvedPackage: 1,
  })
    .populate("vendorId", "name email isDeleted")
    .sort({ createdAt: 1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await VendorDetail.find(userCondition).countDocuments();

  return {
    pagination: GeneralHelper.makePaginationObject(
      pg.pageNo,
      pg.pageSize,
      pg.skip,
      total,
      result.length
    ),
    data: result,
  };
};

exports.vendorDeclineList = async (pageNo) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  let userCondition = [{ approvedPackage: false }];

  // { isOnline: 1, phoneNumber: 1, vendorType: 1 },
  let searchValue = null;
  if (GeneralHelper.isValueSet(searchValue)) {
    searchValue = GeneralHelper.escapeLike(searchValue);
    let regex = new RegExp(searchValue, "i");

    // userCondition.push({
    //   $or: [{ "detail.name": { $regex: regex } }, { email: { $regex: regex } }],
    // });
  }
  userCondition = { $and: userCondition };
  let result = await VendorDetail.find(userCondition, {
    isOnline: 1,
    phoneNumber: 1,
    vendorType: 1,
    packageBought: 1,
    approvedPackage: 1,
  })
    .populate("vendorId", "name email isDeleted")
    .sort({ createdAt: 1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();
  console.log(result);
  let total = 0;
  let vendorDetailData = await VendorDetail.find(userCondition);

  for (let i = 0; i < vendorDetailData.length; i++) {
    let vendorId = vendorDetailData[i].vendorId;
    let vendorData = await userHelper.findUserById(vendorId);
    if (vendorData.isDeleted == false) {
      total++;
    }
  }

  return {
    pagination: GeneralHelper.makePaginationObject(
      pg.pageNo,
      pg.pageSize,
      pg.skip,
      total,
      result.length
    ),
    data: result,
  };
};

exports.usersList = async () => {
  let orderCountArray = [];
  let finalCountWithDataArray = [];
  let userData = await User.find({ role: "User" }, { name: 1, email: 1 });
  for (let i = 0; i < userData.length; i++) {
    let userOrderCount = await Order.find({
      orderBy: userData[i]._id,
    }).countDocuments();
    orderCountArray.push(userOrderCount);
  }
  for (let j = 0; j < userData.length; j++) {
    finalCountWithDataArray.push({
      userData: userData[j],
      orderCount: orderCountArray[j],
    });
  }
  return finalCountWithDataArray;
};
