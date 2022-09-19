//Mongoose
const mongoose = require("mongoose");

//Models
const Package = require("../Models/Package");

exports.savePackage = async (
  packageId,
  packageTitle,
  package,
  price,
  imageLimit
) => {
  const vendorPackage = new Package({
    _id: new mongoose.Types.ObjectId(),
    packageId: packageId,
    packageTitle: packageTitle,
    packageDetail: package,
    price: price,
    imageLimit: imageLimit,
  });

  await vendorPackage.save();

  return true;
};

exports.updatePackage = async (data) => {
  let vendorPackage = await Package.findOne({ packageId: data.packageId });
  vendorPackage.packageTitle = data.packageTitle;
  vendorPackage.packageDetail = data.packageDetail;
  vendorPackage.price = data.price;
  vendorPackage.packageImageLimit = data.packageImageLimit;
  let packageModel = new Package(vendorPackage);
  return await packageModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.allPackage = async () => {
  return Package.find();
};
exports.findPackage = async (packageId) => {
  return Package.findOne({ packageId: packageId });
};
exports.findPackageById = async (_id) => {
  return Package.findOne({ _id: _id });
};
