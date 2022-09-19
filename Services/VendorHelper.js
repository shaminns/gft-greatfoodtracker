//Mongoose
const mongoose = require("mongoose");

//Models
const User = require("../Models/User");
const VendorDetail = require("../Models/VenderDetail");

//Constant
const Role = require("../Constants/Role");

//Helpers
const SignupHelper = require("./SignupHelper");
const { updateOne } = require("../Models/User");

exports.createVendor = async (
  name,
  role,
  email,
  subject,
  passwordEncryption,
  randomActivationCode,
  message,
  userRole,
  vendorType
) => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: name.toLowerCase(),
    role: role,
    email: email,
    password: passwordEncryption,
    activationCode: randomActivationCode,
  });
  await user.save();
  SignupHelper.sendEmail(randomActivationCode, email, subject, message);
  if (userRole == "Admin") {
    await this.updateActivationStatus(email);
  }

  return true;
};

exports.saveRecord = async (name, role, email, passwordEncryption) => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: name.toLowerCase(),
    role: role,
    email: email,
    password: passwordEncryption,
  });

  return await user.save();
};

exports.filterSearch = async (arr) => {
  let vendorDetail = await VendorDetail.find(
    { searchTag: { $in: arr } },
    { _id: 0, searchTag: 1, coverImage: 1 }
  ).populate("vendorId", "name profileImage role longitude latitude");
  return vendorDetail;
};

exports.searchAll = async () => {
  let vendorDetail = await VendorDetail.find(
    {},
    {
      _id: 0,
      searchTag: 1,
      coverImage: 1,
      "servingHours.openTime": 1,
      "servingHours.closeTime": 1,
    }
  ).populate("vendorId", "name profileImage role longitude latitude");
  return vendorDetail;
};

exports.getKey = async (value, requestPayload) => {
  let arr = [];
  for (let key in requestPayload) {
    if (requestPayload[key].toString() == value.toString()) {
      arr.push(key);
    }
  }
  return arr;
};

exports.setSignupLocation = async (userEmail, data) => {
  await User.updateOne(
    { email: userEmail },
    { $set: { longitude: data.longitude, latitude: data.latitude } }
  );
};

exports.getVendorDetail = async (vendorId) => {
  return await VendorDetail.findOne(
    { vendorId: vendorId },
    { isOnline: 1, packageBought: 1, coverImage: 1, vendorType: 1 }
  ).populate("vendorId", "name profileImage latitude longitude address ");
};

exports.findVendorByLocation = async (data) => {
  return await VendorDetail.find()
    .populate({
      path: "vendorId",
      match: { isDeleted: true },
    })
    .exec();
};
exports.findVendorByName = async (data) => {
  return await User.find(
    {
      name: { $regex: data.name.toLowerCase() },
      isDeleted: false,
      role: "Vendor",
    },
    { name: 1, latitude: 1, longitude: 1 }
  );
};

exports.findVendorByNameForSearchBox = async () => {
  return await VendorDetail.find({ isOnline: true }, { isOnline: 1 }).populate(
    "vendorId",
    "name"
  );
};

exports.updateVendorSubscription = async (
  vendorId,
  packageDbId,
  subscriptionExpiry
) => {
  return await VendorDetail.updateOne(
    { vendorId: vendorId },
    { $set: { packageBought: packageDbId, packageExpiry: subscriptionExpiry } }
  );
};
