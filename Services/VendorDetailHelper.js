const moment = require("moment");
const fs = require("fs");

//Mongoose
const mongoose = require("mongoose");

//Models
const User = require("../Models/User");
const VendorDetail = require("../Models/VenderDetail");

//Constant
const Role = require("../Constants/Role");

exports.saveVendorDetail = async (request, vendorId) => {
  const vendor = new VendorDetail({
    _id: new mongoose.Types.ObjectId(),
    vendorId: vendorId,
    vendorType: request.vendorType,
  });

  await vendor.save();
  return true;
};

exports.setPackage = async (vendorId, packageID) => {
  return VendorDetail.updateOne(
    { vendorId: vendorId },
    { $set: { packageBought: packageID } }
  );
};

exports.updateVendorDetail = async (vendorId, request) => {
  let vendorResult = await VendorDetail.findOne({ vendorId: vendorId });

  vendorResult.vendorType = request.vendorType || vendorResult.vendorType;
  vendorResult.phoneNumber = request.phoneNumber || vendorResult.phoneNumber;
  vendorResult.city = request.city || vendorResult.city;
  vendorResult.country = request.country || vendorResult.country;
  vendorResult.searchTag = request.searchTag || vendorResult.searchTag;
  vendorResult.packageBought =
    request.packageDbId || vendorResult.packageBought;

  let vendorDeatilModel = new VendorDetail(vendorResult);
  return vendorDeatilModel.save().then((fullfilled) => {
    return fullfilled;
  });
};

exports.findVendorDetailByVendorId = async (vendorId) => {
  return await VendorDetail.findOne({ vendorId: vendorId });
};
exports.findPendingVendorDetailByVendorId = async (vendorId) => {
  return await VendorDetail.findOne({
    vendorId: vendorId,
  });
};
exports.updateVendorPackage = async (vendorId, packageId) => {
  return await VendorDetail.updateOne(
    { vendorId: vendorId },
    {
      packageBought: packageId,
    }
  );

  // vendorResult.packageBought = packageId || vendorResult.packageBought;

  // let vendorDeatilModel = new VendorDetail(vendorResult);
  // return vendorDeatilModel.save().then((fullfilled) => {
  //   return fullfilled;
  // });
};

exports.addsearchTagAndBasicDetails = async (vendorId, data, arr) => {
  await VendorDetail.updateOne(
    { vendorId: vendorId },
    {
      city: data.city,
      country: data.country,
      phoneNumber: data.phoneNumber,
    }
  );
  await User.updateOne({ _id: vendorId }, { $set: { address: data.address } });

  await VendorDetail.updateOne(
    { vendorId: vendorId },
    {
      servingHours: {
        openTime: data.openTime,
        closeTime: data.closeTime,
      },
    }
  );
  await VendorDetail.findOneAndUpdate(
    { vendorId: vendorId },
    { searchTag: arr },
    { new: true, useFindAndModify: false }
  ).catch((err) => {
    if (err) console.log(err);

    return err;
  });

  return true;
};
exports.updateServingTime = async (vendorId, data, arr) => {
  await VendorDetail.updateOne(
    { vendorId: vendorId },
    {
      servingHours: {
        openTime: data.openTime,
        closeTime: data.closeTime,
      },
    }
  );

  return true;
};
exports.updateSearchTag = async (vendorId, arr) => {
  return await VendorDetail.findOneAndUpdate(
    { vendorId: vendorId },
    { searchTag: arr },
    { new: true, useFindAndModify: false }
  ).catch((err) => {
    if (err) console.log(err);

    return err;
  });
};
exports.addCoverImage = async (_id, imagePath) => {
  return await VendorDetail.updateOne(
    { vendorId: _id },
    { coverImage: imagePath }
  );
};

exports.vendorInfo = async (vendorId) => {
  return await VendorDetail.findOne(
    { vendorId: vendorId },
    { coverImage: 1, _id: 0 }
  ).populate("vendorId", "profileImage name latitude longitude");
};

exports.vendorAllDetail = async (vendorId) => {
  return await VendorDetail.findOne(
    { vendorId: vendorId },
    {
      vendorType: 1,
      phoneNumber: 1,
      "servingHours.openTime": 1,
      "servingHours.closeTime": 1,
      _id: 0,
    }
  ).populate("vendorId", "name email address");
};

exports.setOnlineStatus = async (vendorId, data) => {
  // let onlineStatus;
  // if (data.isOnline == true) {
  //   onlineStatus = process.env.ONLINE;
  // }
  // if (data.isOnline == false) {
  //   onlineStatus = process.env.CLOSE;
  // }
  return await VendorDetail.updateOne(
    { vendorId: vendorId },
    { isOnline: data.isOnline }
  );
};
exports.approveVendorPackage = async (vendorId, status) => {
  return await VendorDetail.updateOne(
    { vendorId: vendorId },
    { approvedPackage: status }
  );
};
exports.updateVendorPackageByPackageId = async (vendorId, package_id) => {
  return await VendorDetail.updateOne(
    { vendorId: vendorId },
    { packageBought: package_id }
  );
};
exports.addVendorPreviousLocation = async (vendorId, data) => {
  return await VendorDetail.updateOne(
    { vendorId: vendorId },
    {
      $push: {
        previousLocations: {
          locationName: data.locationName,
          longitude: data.longitude,
          latitude: data.latitude,
        },
      },
    }
  );
};
exports.getVendorAllLocation = async (vendorId) => {
  return await VendorDetail.findOne(
    { vendorId: vendorId },
    {
      previousLocations: 1,
    }
  );
};
exports.findSearchTagExist = async (tagName) => {
  return await VendorDetail.find({ searchTag: { $in: tagName } });
};
exports.allVendorLocationDetail = async () => {
  return await VendorDetail.find(
    { approvedPackage: true, coverImage: { $ne: "default.jpg" } },
    {
      coverImage: 1,
      isOnline: 1,
      "servingHours.openTime": 1,
      "servingHours.closeTime": 1,
      vendorType: 1,
      searchTag: 1,
      _id: 0,
      vendorId: 1,
    }
  ).populate("vendorId", "name profileImage latitude longitude address");
};
exports.searchPendingSubsVendor = async (name) => {
  return await User.find(
    { role: "Vendor", name: { $regex: name } },
    { name: 1, email: 1 }
  );
};
exports.searchDeclineVendor = async (name) => {
  return await User.find(
    { role: "Vendor", name: { $regex: name } },
    { name: 1, email: 1 }
  );
};
exports.addTrialExpiryDate = async (userId, trialExpiry) => {
  let vendor = await VendorDetail.findOne({ vendorId: userId });
  vendor.packageTrialExpiry = trialExpiry;

  let vendorModel = new VendorDetail(vendor);
  return vendorModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
