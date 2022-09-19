//Mongoose
const mongoose = require("mongoose");
const fs = require("fs");

//Models
const User = require("../Models/User");
const Menu = require("../Models/Menu");

exports.saveMenu = async (
  vendorId,
  data,
  finalDiscountPercentage,
  discountPrice,
  menuImagePath
) => {
  const menu = new Menu({
    _id: new mongoose.Types.ObjectId(),
    vendorId: vendorId,
    menuItem: {
      title: data.title.toLowerCase(),
      description: data.description.toLowerCase(),
      price: data.price,
      discount: finalDiscountPercentage,
      discountValue: data.discountValue,
      discountPrice: discountPrice,
      menuImage: menuImagePath,
    },
  });
  return await menu.save();
  // await Menu.updateOne(
  //   { _id: menu._id },
  //   { $push: { "menuItem.menuImage": menuImagePath } }
  // );
  // return true;
};

exports.findMenuById = async (data) => {
  return await Menu.findOne({ _id: data.menuId });
};

exports.findMenuItem = async (vendor, title) => {
  return await Menu.find({
    vendorId: vendor,
    "menuItem.title": title.toLowerCase(),
    isDeleted: false,
  }).countDocuments();
};

exports.showVendorMenu = async (vendor) => {
  return await Menu.find({ vendorId: vendor, isDeleted: 0 }).sort({
    createdAt: -1,
  });
};

exports.showVendorMenuForUser = async (vendor) => {
  return await Menu.find({
    vendorId: vendor,
    isDeleted: 0,
    isActivated: 1,
  }).sort({
    createdAt: -1,
  });
};
exports.getImageLimitStatus = async (vendor, menuId, packageImageLimit) => {
  imageCountStatus = await Menu.findOne({
    vendorId: vendor,
    _id: menuId,
  });

  let imgCount = imageCountStatus.imageCount;

  if (imgCount < packageImageLimit) {
    return true;
  }
  if (imgCount >= packageImageLimit) {
    return false;
  }
};

exports.getPackageImageLimitStatus = async (vendor, packageImageLimit) => {
  imageCountStatus = await Menu.findOne({
    vendorId: vendor,
  });
  let imgCount = imageCountStatus.imageCount;

  if (imgCount < packageImageLimit) {
    return true;
  }
  if (imgCount >= packageImageLimit) {
    return false;
  }
};
exports.addMenuImage = async (vendor, menuId, menuImagePath) => {
  await Menu.updateOne(
    { vendorId: vendor, _id: menuId },
    { $push: { "menuItem.menuImage": menuImagePath } }
  );
  await Menu.updateOne(
    { vendorId: vendor, _id: menuId },
    { $inc: { imageCount: 1 } }
  );
};
exports.findMenuItemByTitle = async (title) => {
  return await Menu.find(
    {
      "menuItem.title": { $regex: title.toLowerCase() },
    },
    // { $group: { _id: "$vendorId" } },
    { "menuItem.title": 1 }
  ).populate("vendorId", "name profileImage latitude longitude");
};

exports.findMenuByVendorId = async (vendorId) => {
  return await Menu.findOne({ vendorId: vendorId });
};
exports.addPackageTwoImage = async (vendorId, menuImagePath) => {
  const menu = new Menu({
    _id: new mongoose.Types.ObjectId(),
    vendorId: vendorId,
    "menuItem.menuImage": menuImagePath,
  });
  await menu.save();
  await Menu.updateOne({ vendorId: vendorId }, { $inc: { imageCount: 1 } });
  return true;
};
exports.addMorePackageTwoImage = async (vendorId, menuImagePath) => {
  await Menu.updateOne(
    { vendorId: vendorId },
    { $push: { "menuItem.menuImage": menuImagePath } }
  );
  await Menu.updateOne({ vendorId: vendorId }, { $inc: { imageCount: 1 } });
  return true;
};

exports.deletePackageTwoImage = async (vendorId, menuImagePath) => {
  await Menu.updateOne(
    { vendorId: vendorId },
    { $pull: { "menuItem.menuImage": menuImagePath } }
  );
};

exports.findVendorByMenuId = async (menuId) => {
  let menu = await Menu.findOne({ _id: menuId });
  return menu.vendorId;
};

exports.setActivationStatus = async (data) => {
  return await Menu.updateOne(
    { _id: data._id },
    { $set: { isActivated: data.actStatus } }
  );
};
exports.deleteMenu = async (vendorId, data) => {
  return await Menu.updateOne(
    {
      // vendorId: vendorId,
      // "menuItem.title": data.title,
      _id: data._id,
    },
    { $set: { isDeleted: 1 } }
  );
};

exports.updateMenu = async (
  data,
  finalDiscountPercentage,
  discountPrice,
  menuImagePath,
  oldImage
) => {
  let menu = await Menu.findOne({ _id: data.menuId });

  menu.menuItem.title = data.title.toLowerCase() || menu.menuItem.title;
  menu.menuItem.description =
    data.description.toLowerCase() || menu.menuItem.description;
  menu.menuItem.price = data.price || menu.menuItem.price;
  menu.menuItem.discount = finalDiscountPercentage || menu.menuItem.discount;
  menu.menuItem.discountPrice = discountPrice || menu.menuItem.discountPrice;
  menu.menuItem.discountValue =
    data.discountValue || menu.menuItem.discountValue;
  menu.menuItem.menuImage = menuImagePath || menu.menuItem.menuImage;
  let menuModel = new Menu(menu);
  await menuModel.save().then((fulfilled) => {
    if (oldImage != "default.jpg" || oldImage != "") {
      if (menuImagePath != oldImage) {
        fs.unlinkSync(oldImage);
      }
    }
    return fulfilled;
  });
};

// exports.showAllMenuTitleForSearchBox = async () => {
//   return await Menu.find({}, { _id: 0, "menuItem.title": 1 });
// };
exports.showAllMenuTitleForSearchBox = async () => {
  return await Menu.find({}, { _id: 0, vendorId: 1, "menuItem.title": 1 });
};
exports.findMenuByMenuIdAndVendorId = async (menuId, vendorId) => {
  return await Menu.findOne({ _id: menuId, vendorId: vendorId });
};
exports.deleteMenuByTitle = async (title) => {
  return await Menu.deleteOne({ "menuItem.title": title });
};
