//Mongoose
const mongoose = require("mongoose");

//Models
const User = require("../Models/User");
const VendorDetail = require("../Models/VenderDetail");
const Order = require("../Models/Order");
const AppleUser = require("../Models/AppleUser");

//Helpers
const GeneralHelper = require("./GeneralHelper");

exports.updateRoleForAdmin = async (data) => {
  return User.updateOne({ email: data.email }, { $set: { role: "Admin" } });
};
exports.saveRecord = async (name, role, email, passwordEncryption) => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: name.toLowerCase(),
    role: role,
    email: email,
    password: passwordEncryption,
  });

  await user.save();
  await this.updateActivationStatus(email);
  return true;
};

exports.findUserByEmail = async (email) => {
  return User.findOne({ email: email, isDeleted: false });
};
exports.findBlockUser = async (email) => {
  return User.findOne({ email: email });
};
exports.findUserByEmailForSignup = async (email) => {
  return User.findOne({ email: email, isDeleted: true });
};
exports.updateActivationStatus = async (email) => {
  return User.updateOne({ email: email }, { $set: { isActivated: true } });
};

exports.deleteUser = async (email) => {
  return User.updateOne(
    { email: email },
    { $set: { isDeleted: true, isActivated: false } }
  );
};
exports.unDeleteUser = async (email) => {
  return User.updateOne({ email: email }, { $set: { isDeleted: false } });
};
exports.activateUser = async (email) => {
  return User.updateOne({ email: email }, { $set: { isActivated: true } });
};
exports.findUserById = async (_id) => {
  return await User.findOne({ _id: _id });
};
exports.updateUserAllInfo = async (_id, data) => {
  let user = await User.findOne({ _id: _id });

  user.name = data.name.toLowerCase();
  user.longitude = data.longitude || user.longitude;
  user.latitude = data.latitude || user.latitude;
  user.address = data.address || user.address;
  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.updateUserLoc = async (_id, data) => {
  let user = await User.findOne({ _id: _id });
  user.longitude = data.longitude || user.longitude;
  user.latitude = data.latitude || user.latitude;
  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.setForgotCode = async (userEmail, forgotCode) => {
  let user = await User.findOne({ email: userEmail });
  user.forgotCode = forgotCode;
  let userModel = new User(user);
  return userModel.save().then((fulfilled) => {
    return fulfilled;
  });
};
exports.updateActivationCode = async (userEmail, newActivationCode) => {
  let user = await User.findOne({ email: userEmail });
  user.activationCode = newActivationCode;
  let userModel = new User(user);
  return userModel.save().then((fulfilled) => {
    return fulfilled;
  });
};
exports.updateForgotPassword = async (data, bcryptPassword) => {
  let user = await User.findOne({ email: data.email });
  user.password = bcryptPassword || user.password;
  user.forgotCode = null;
  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.updateResetPassword = async (_id, bcryptPassword) => {
  let user = await User.findOne({ _id: _id });
  user.password = bcryptPassword || user.password;
  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.findvendor = async (userEmail) => {
  return User.findOne({ email: userEmail });
};
exports.findAllUsers = async (pageNo, userRole) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  let userCondition = [{ role: userRole }];
  let searchValue = null;
  if (GeneralHelper.isValueSet(searchValue)) {
    searchValue = GeneralHelper.escapeLike(searchValue);
    let regex = new RegExp(searchValue, "i");

    // userCondition.push({
    //   $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
    // });
  }
  userCondition = { $and: userCondition };
  let result = await User.find(userCondition)
    .sort({ createdAt: 1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await User.find(userCondition).countDocuments();

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
exports.findAllVendors = async (pageNo) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  let userCondition; //= [{ role: userRole }];
  let searchValue = null;
  if (GeneralHelper.isValueSet(searchValue)) {
    searchValue = GeneralHelper.escapeLike(searchValue);
    let regex = new RegExp(searchValue, "i");

    // userCondition.push({
    //   $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
    // });
  }
  userCondition = { $and: userCondition };
  let result = await VendorDetail.find()
    .populate("vendorId")
    .sort({ createdAt: 1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await VendorDetail.find().countDocuments();

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
exports.getUsersByName = async (userRole, userName) => {
  return User.find({
    role: userRole,
    name: { $regex: userName },
  });
};
exports.getAllUsersByRole = async (userRole) => {
  return User.find({ role: userRole });
};
exports.addFavouriteVendor = async (_id, vendorId) => {
  await User.updateOne({ _id: _id }, { $push: { favouriteStatus: vendorId } });
};
exports.findAlreadyFavourite = async (_id, vendorId) => {
  return await User.find(
    { _id: _id, favouriteStatus: { $in: vendorId } },
    { name: 1, profileImage: 1, longitude: 1, latitude: 1 }
  ).countDocuments();
};
exports.deleteFavouriteVendor = async (_id, vendorId) => {
  await User.updateOne({ _id: _id }, { $pull: { favouriteStatus: vendorId } });
};
exports.getFavouriteVendorId = async (userId) => {
  return await User.findOne({ _id: userId }, { favouriteStatus: 1, _id: 0 });
};

exports.addProfileImage = async (_id, imagePath) => {
  return await User.updateOne({ _id: _id }, { profileImage: imagePath });
};
exports.setRating = async (data, orderRating) => {
  // let checkRating = await User.findOne(
  //   { _id: data.vendorId },
  //   { rating: 1, _id: 0 } //rating column
  // );

  // let pRating = checkRating.rating;
  // let ratingPoints = pRating + 1;

  // let user = await User.findOne({ _id: data.vendorId });
  // user.rating = ratingPoints || user.rating;
  // let userModel = new User(user);
  // return userModel.save().then((fullfilled) => {
  //   return fullfilled;
  // });
  return await User.updateOne(
    { _id: data.vendorId },
    { $push: { rating: orderRating } }
  );
};

exports.getRating = async (vendorId) => {
  let tOrder;
  return await User.findOne({ _id: vendorId }, { rating: 1, _id: 0 });
  // let checkRating = await User.findOne(
  //   { _id: vendorId },
  //   { rating: 1, _id: 0 }
  // );
  // if (checkRating != null) {
  //   let favOrder = checkRating.rating;
  //   let status = [
  //     process.env.READY_ORDER,
  //     process.env.COMPLETED_ORDER,
  //     process.env.DELIVERED_ORDER,
  //   ];
  //   let totalOrder = await Order.find({
  //     orderTo: vendorId,
  //     deliveryStatus: { $in: status },
  //   }).countDocuments();
  //   if (totalOrder == 0) {
  //     tOrder = 1;
  //   }
  //   if (totalOrder != 0) {
  //     tOrder = totalOrder;
  //   }
  //   console.log("favOrder", favOrder);
  //   console.log("tOrder", tOrder);
  //   let result = (favOrder / tOrder) * process.env.RATING_LIMIT;

  //   let rating = result.toFixed(1);

  // return rating;
  // }
  // if (checkRating == null) {
  //   return 0.0;
  // }
};

exports.addUpdateBankDetail = async (_id, data) => {
  let user = await User.findOne({ _id: _id });
  user.bankDetail.bankName = data.bankName || user.bankDetail.bankName;
  user.bankDetail.accountHolderName =
    data.accountHolderName || user.bankDetail.accountHolderName;
  user.bankDetail.accountNumber =
    data.accountNumber || user.bankDetail.accountNumber;
  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.showFavorite = async (userId) => {
  let userDetail = await User.findOne({ _id: userId }, { name: 1 }).populate(
    "favouriteStatus",
    "name coverImage longitude latitude"
  );
  let favArray = await User.findOne({ _id: userId }, { favouriteStatus: 1 });
  let userArray = [];
  let vendorFinalArray = [];
  let vendorDetailArray = [];
  for (let i = 0; i < favArray.favouriteStatus.length; i++) {
    let tempVendor = await VendorDetail.findOne({
      vendorId: favArray.favouriteStatus[i],
    });
    userArray.push(userDetail.favouriteStatus[i]);
    vendorDetailArray.push({
      servingHours: tempVendor.servingHours,
      coverImage: tempVendor.coverImage,
    });
  }
  for (let j = 0; j < favArray.favouriteStatus.length; j++) {
    vendorFinalArray.push({
      userDetail: userArray[j],
      vendorDetail: vendorDetailArray[j],
    });
  }
  return vendorFinalArray;
};
exports.favouriteVendorsArray = async (userId) => {
  return await User.findOne({ _id: userId }, { favouriteStatus: 1 });
};
exports.hardCodeDeleteUser = async (email) => {
  return User.deleteOne({ email: email });
};
exports.hardCodeDeleteVendorDetail = async (_id) => {
  return VendorDetail.deleteOne({ vendorId: _id });
};
exports.updateDeviceToken = async (email, deviceToken) => {
  return User.updateOne(
    { email: email },
    { $set: { deviceToken: deviceToken } }
  );
};
exports.findAllUserForNewsFeedNotification = async (vendorId) => {
  let vendorIdForObj = vendorId;
  let vendorIdObj = mongoose.Types.ObjectId(vendorIdForObj);
  return User.find(
    {
      role: "User",
      favouriteStatus: { $in: [vendorIdObj] },
    },
    { name: 1 }
  );
};
exports.updateDeviceTokenOfOtherUsers = async (deviceToken) => {
  return User.updateMany(
    { deviceToken: deviceToken },
    { $set: { deviceToken: "" } }
  );
};
exports.deleteDeviceToken = async (userId) => {
  return User.updateOne({ _id: userId }, { $set: { deviceToken: "" } });
};
exports.addStripeDetail = async (
  userEmail,
  stripePublicKey,
  stripeSecretKey
) => {
  let user = await User.findOne({ email: userEmail });
  user.stripeDetail.publicKey = stripePublicKey;
  user.stripeDetail.secretKey = stripeSecretKey;

  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};

exports.updateStripeDetail = async (
  vendorId,
  stripePublicKey,
  stripeSecretKey
) => {
  let user = await User.findOne({ _id: vendorId });
  user.stripeDetail.publicKey = stripePublicKey || user.stripeDetail.publicKey;
  user.stripeDetail.secretKey = stripeSecretKey || user.stripeDetail.secretKey;

  let userModel = new User(user);
  return userModel.save().then((fullfilled) => {
    return fullfilled;
  });
};

exports.isAppleUser = async () => {
  return AppleUser.findOne({ recordNumber: 1 });
};

exports.createEntryIsAppleUser = async () => {
  const appleUser = new AppleUser({
    _id: new mongoose.Types.ObjectId(),
    recordNumber: 1,
  });

  await appleUser.save();
  return true;
};

exports.updatAppleUser = async (status) => {
  return AppleUser.updateOne(
    { recordNumber: 1 },
    { $set: { isAppleUser: status } }
  );
};
