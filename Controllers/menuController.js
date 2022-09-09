const fs = require("fs");
//Mongoose
const mongoose = require("mongoose");

// Helpers
const responseHelper = require("../Services/ResponseHelper");
const menuHelper = require("../Services/MenuHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const packageHelper = require("../Services/PackageHelper");
const cartHelper = require("../Services/CartHelper");
const userHelper = require("../Services/UserHelper");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");
//********************************************************************************
// Add Menu Image - (Additional api for future use)
//********************************************************************************

//////////////////////////////////////////////////////////////////////////////////
// Note: Following info for run this api
// Link: .....api/menu/addMenuImage
// Required Fields:
// 1-Vendor Token.
// 2-menuId - in which you want to upload image.
// 3-menuImage - Image File (for upload).
//////////////////////////////////////////////////////////////////////////////////

exports.addMenuImage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let menuId = req.body.menuId;

  //check image
  if (!req.file) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IMAGE_NOT_READ
    );
    return res.status(response.code).json(response);
  }

  // Get Token
  let token = req.headers.authorization;
  let vendor = await tokenExtractor.getInfoFromToken(token);
  if (vendor == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  let vendorDetail = await vendorDeatailHelper.findVendorDetailByVendorId(
    vendor
  );

  let packageId = vendorDetail.packageBought;
  let packageDetail = await packageHelper.findPackageById(packageId);
  let packageImageLimit = packageDetail.imageLimit;
  if (req.file) {
    // Get Path of New Store Image
    let menuImagePath = req.file.path;

    let imageLimit = await menuHelper.getImageLimitStatus(
      vendor,
      menuId,
      packageImageLimit
    );
    if (imageLimit == false) {
      fs.unlinkSync(menuImagePath);
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.LIMIT_EXCEEDED
      );
      return res.status(response.code).json(response);
    }
    if (imageLimit == true) {
      await menuHelper.addMenuImage(vendor, menuId, menuImagePath);
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        menuImagePath
      );
      return res.status(response.code).json(response);
    }
  }
};

//********************************************************************************
// Add Menu
//********************************************************************************
exports.addMenu = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let menuImagePath;
  //check image
  if (!req.file) {
    menuImagePath = "";
  }

  if (req.file) {
    // Get Path of New Store Image
    menuImagePath = req.file.path;
  }
  // Get Token
  let token = req.headers.authorization;
  let vendor = await tokenExtractor.getInfoFromToken(token);
  if (vendor == null) {
    if (req.file) {
      menuImagePath = req.file.path;
      fs.unlinkSync(menuImagePath);
    }
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  if (!(request.title && request.description && request.price)) {
    if (req.file) {
      menuImagePath = req.file.path;
      fs.unlinkSync(menuImagePath);
    }

    let response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }

  if (request.title && request.description && request.price) {
    let menuItemCheck = await menuHelper.findMenuItem(vendor, request.title);

    if (menuItemCheck > 0) {
      if (req.file) {
        menuImagePath = req.file.path;
        fs.unlinkSync(menuImagePath);
      }
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.ALREADY_EXIST
      );
      return res.status(response.code).json(response);
    }

    if (menuItemCheck == 0) {
      let finalDiscountPercentage;
      let percentageVal;
      if (request.discountValue == 1) {
        //price
        // if (floatingDiscount <= floatingPrice) {
        //   response = responseHelper.setResponse(
        //     responseCode.NOT_SUCCESS,
        //     Message.PRICE_ERROR
        //   );
        //   return res.status(response.code).json(response);
        // }
        // if (request.discount > request.price) {
        percentageVal = (request.discount / request.price) * 100;
        finalDiscountPercentage = percentageVal.toFixed(2);
        if (finalDiscountPercentage >= 100) {
          response = responseHelper.setResponse(
            responseCode.NOT_SUCCESS,
            Message.PRICE_ERROR
          );
          return res.status(response.code).json(response);
        }
        // }
      }
      if (request.discountValue == 2) {
        //percentage
        if (request.discount >= 100) {
          if (req.file) {
            menuImagePath = req.file.path;
            fs.unlinkSync(menuImagePath);
          }
          response = responseHelper.setResponse(
            responseCode.NOT_SUCCESS,
            Message.PERCENTAGE_ERROR
          );
          return res.status(response.code).json(response);
        }
        if (request.discount < 100) {
          percentageVal = request.discount;
          finalDiscountPercentage = request.discount;
        }
      }
      let roundedPercentage = parseFloat(percentageVal).toFixed(2);
      let aa = roundedPercentage / 100;
      let bb = 1 - aa;
      let discountPrice = (request.price * bb).toFixed(2);

      await menuHelper.saveMenu(
        vendor,
        req.body,
        finalDiscountPercentage,
        discountPrice,
        menuImagePath
      );

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Show Menu (for vendor) api
//********************************************************************************
exports.showVendorMenu = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  let vendorMenu = await menuHelper.showVendorMenu(vendorId);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    vendorMenu
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Update Menu (for vendor) api
//********************************************************************************
exports.updateVendorMenu = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let title = request.title.toLowerCase();
  let menuImagePath;

  let menuItemCheck = await menuHelper.findMenuById(request);
  let menuTitle = menuItemCheck.menuItem.title;
  let oldImage = menuItemCheck.menuItem.menuImage;

  //image check
  if (req.file) {
    // Get Path of New Store Image
    menuImagePath = req.file.path;

    // if (
    //   menuItemCheck.menuItem.menuImage != "default.jpg" ||
    //   menuItemCheck.menuItem.menuImage != ""
    // ) {
    //   fs.unlinkSync(oldImage);
    // }
  }
  if (!req.file) {
    menuImagePath = oldImage;
  }
  if (!req.headers.authorization) {
    if (req.file) {
      if (oldImage != "default.jpg" || oldImage != "") {
        fs.unlinkSync(menuImagePath);
      }
    }
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;

  // User ID from Token
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    if (req.file) {
      if (oldImage != "default.jpg" || oldImage != "") {
        fs.unlinkSync(menuImagePath);
      }
    }
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let vendorMenuNameCheck = await menuHelper.findMenuByMenuIdAndVendorId(
      request.menuId,
      vendorId
    );
    let vendorMenuName = vendorMenuNameCheck.menuItem.title;
    if (menuItemCheck != null) {
      if (menuTitle != title) {
        if (vendorMenuName.match(title)) {
          if (req.file) {
            if (oldImage != "default.jpg" || oldImage != "") {
              fs.unlinkSync(menuImagePath);
            }
          }
          response = responseHelper.setResponse(
            responseCode.NOT_SUCCESS,
            Message.ALREADY_EXIST
          );
          return res.status(response.code).json(response);
        }
      }

      let finalDiscountPercentage;
      let percentageVal;
      if (request.discountValue == 1) {
        //price
        // if (floatingDiscount <= floatingPrice) {
        //   response = responseHelper.setResponse(
        //     responseCode.NOT_SUCCESS,
        //     Message.PRICE_ERROR
        //   );
        //   return res.status(response.code).json(response);
        // }
        // if (request.discount > request.price) {
        percentageVal = (request.discount / request.price) * 100;
        finalDiscountPercentage = percentageVal.toFixed(2);
        if (finalDiscountPercentage >= 100) {
          response = responseHelper.setResponse(
            responseCode.NOT_SUCCESS,
            Message.PRICE_ERROR
          );
          return res.status(response.code).json(response);
        }
        // }
      }
      if (request.discountValue == 2) {
        //percentage
        if (request.discount >= 100) {
          if (req.file) {
            menuImagePath = req.file.path;
            fs.unlinkSync(menuImagePath);
          }
          response = responseHelper.setResponse(
            responseCode.NOT_SUCCESS,
            Message.PERCENTAGE_ERROR
          );
          return res.status(response.code).json(response);
        }
        if (request.discount < 100) {
          percentageVal = request.discount;
          finalDiscountPercentage = request.discount;
        }
      }
      let roundedPercentage = parseFloat(percentageVal).toFixed(2);
      let aa = roundedPercentage / 100;
      let bb = 1 - aa;
      let discountPrice = (request.price * bb).toFixed(2);

      await menuHelper.updateMenu(
        req.body,
        finalDiscountPercentage,
        discountPrice,
        menuImagePath,
        oldImage
      );

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Add Image for Package Two
//********************************************************************************

exports.addPackageTwoImage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

  //check image
  if (!req.file) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.IMAGE_NOT_READ
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  let vendorDetail = await vendorDeatailHelper.findVendorDetailByVendorId(
    vendorId
  );

  let packageId = vendorDetail.packageBought;
  let packageDetail = await packageHelper.findPackageById(packageId);
  let packageImageLimit = packageDetail.imageLimit;
  if (req.file) {
    // Get Path of New Store Image
    let menuImagePath = req.file.path;
    let menuCheck = await menuHelper.findMenuByVendorId(vendorId);
    if (menuCheck == null) {
      await menuHelper.addPackageTwoImage(vendorId, menuImagePath);
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        menuImagePath
      );
      return res.status(response.code).json(response);
    }

    if (menuCheck != null) {
      // await menuHelper.addMorePackageTwoImage(
      //   vendorId,
      //   menuId,
      //   menuImagePath
      // );
      let imageLimit = await menuHelper.getPackageImageLimitStatus(
        vendorId,
        packageImageLimit
      );
      if (imageLimit == false) {
        fs.unlinkSync(menuImagePath);
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.LIMIT_EXCEEDED
        );
        return res.status(response.code).json(response);
      }
      if (imageLimit == true) {
        await menuHelper.addMorePackageTwoImage(vendorId, menuImagePath);
        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.REQUEST_SUCCESSFUL,
          menuImagePath
        );
        return res.status(response.code).json(response);
      }
    }
  }
};
//********************************************************************************
// Delete Image for Package Two
//********************************************************************************

exports.deletePackageTwoImage = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let menuImagePath = req.body.menuImagePath;
  // Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (!menuImagePath) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  if (menuImagePath) {
    await menuHelper.deletePackageTwoImage(vendorId, menuImagePath);
    fs.unlinkSync(menuImagePath);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Set Vendor's Menu Activation Status
//********************************************************************************
exports.menuActivationStatus = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
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
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    await menuHelper.setActivationStatus(request);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Delete Vendor's Menu
//********************************************************************************
exports.deleteMenu = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
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
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    await menuHelper.deleteMenu(vendorId, request);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
// //********************************************************************************
// // Update Vendor's Menu
// //********************************************************************************
// exports.updateMenu = async (req, res, next) => {
//   let response = responseHelper.getDefaultResponse();
//   let request = req.body;

//   await menuHelper.updateMenu(request);
//   response = responseHelper.setResponse(
//     responseCode.SUCCESS,
//     Message.REQUEST_SUCCESSFUL
//   );
//   return res.status(response.code).json(response);
// };

//********************************************************************************
// Show Vendor's Menu Item for Update
//********************************************************************************
exports.showMenuForUpdate = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let discount;
  let menuResult = await menuHelper.findMenuById(request);
  let discountValue = menuResult.menuItem.discountValue;
  if (discountValue == 1) {
    discount = menuResult.menuItem.price - menuResult.menuItem.discountPrice;
  }
  if (discountValue == 2) {
    discount = menuResult.menuItem.discount;
  }
  let result = {
    _id: menuResult._id,
    title: menuResult.menuItem.title,
    description: menuResult.menuItem.description,
    price: menuResult.menuItem.price,
    discountValue: menuResult.menuItem.discountValue,
    discount: discount,
  };
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Show Menu (for user) api
//********************************************************************************
exports.showVendorMenuForUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  let vendorMenuArr = [];
  let cartItemArr = [];
  let finalMenuArr = [];

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let vendorMenu = await menuHelper.showVendorMenuForUser(vendorId);

    let vendorOrderDetail = await cartHelper.vendorItemCheck(userId, vendorId);
    if (vendorOrderDetail != null) {
      for (let i = 0; i < vendorOrderDetail.orderItem.length; i++) {
        cartItemArr.push(vendorOrderDetail.orderItem[i].menuItem.toString());
      }
      for (let j = 0; j < vendorMenu.length; j++) {
        vendorMenuArr.push(vendorMenu[j]._id.toString());
      }
      for (let k = 0; k < vendorMenu.length; k++) {
        let itemResult = cartItemArr.includes(vendorMenu[k]._id.toString());
        let currentItemId = vendorMenu[k]._id;
        let itemCount;
        if (itemResult == true) {
          for (let m = 0; m < vendorOrderDetail.orderItem.length; m++) {
            if (vendorOrderDetail.orderItem[m].menuItem.equals(currentItemId)) {
              itemCount = vendorOrderDetail.orderItem[m].quantity;
            }
          }
        }
        if (itemResult == false) {
          itemCount = 0;
        }

        finalMenuArr.push({
          vendorMenu: vendorMenu[k],
          orderQuantity: itemCount,
        });
      }
    }
    if (vendorOrderDetail == null) {
      let itemCount = 0;
      for (let i = 0; i < vendorMenu.length; i++) {
        finalMenuArr.push({
          vendorMenu: vendorMenu[i],
          orderQuantity: itemCount,
        });
      }
    }
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    finalMenuArr
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Show All Menu Title api (for search box)
//********************************************************************************
exports.showAllMenuTitle = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorMenuArr = [];
  let vendorMenu = await menuHelper.showAllMenuTitleForSearchBox();
  for (let i = 0; i < vendorMenu.length; i++) {
    let vendorId = vendorMenu[i].vendorId;
    let userIsDeletedCheck = await userHelper.findUserById(vendorId);
    let vendorOnlineCheck = await vendorDetailHelper.findVendorDetailByVendorId(
      vendorId
    );
    if (
      userIsDeletedCheck.isDeleted == false &&
      vendorOnlineCheck.isOnline == true
    ) {
      vendorMenuArr.push({
        menuItem: { title: vendorMenu[i].menuItem.title },
      });
    }
  }
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    vendorMenuArr
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Delete Menu By Title - for admin
//********************************************************************************
exports.DeleteMenuByTitle = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

  await menuHelper.deleteMenuByTitle(req.body.title.toLowerCase());
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
