const jwt = require("jsonwebtoken");
const fs = require("fs");

//Helper
const cartHelper = require("../Services/CartHelper");
const menuHelper = require("../Services/MenuHelper");
const responseHelper = require("../Services/ResponseHelper");
const userHelper = require("../Services/UserHelper");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

//Constant
const message = require("../Constants/Message");
const responseCode = require("../Constants/ResponseCode");

//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Add new item and update existing item in cart
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.addToCart = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

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
    let finalQuantity;
    let ItemQuantity = request.quantity;
    let itemForVendorId = request.menuId;
    let vendorId = await menuHelper.findVendorByMenuId(itemForVendorId);

    let vendorAlreadyItem = await cartHelper.vendorItemCheck(userId, vendorId);

    let userPreviousOrder = await cartHelper.userAlreadyOrder(userId);
    if (userPreviousOrder == null) {
      await cartHelper.saveToCart(userId, vendorId, request);
      await cartHelper.updateTotalQuantityOfOrder(
        userId,
        vendorId,
        request.quantity
      );
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
    if (userPreviousOrder != null) {
      if (vendorAlreadyItem != null) {
        let oldItemQuantity = await cartHelper.alreadyItemCheck(
          userId,
          vendorId,
          request
        );

        if (oldItemQuantity != null) {
          for (let i = 0; i < oldItemQuantity.orderItem.length; i++) {
            if (oldItemQuantity.orderItem[i].menuItem == request.menuId) {
              finalQuantity =
                request.quantity + oldItemQuantity.orderItem[i].quantity;
            }
          }

          await cartHelper.updateOldCartItem(
            userId,
            vendorId,
            request,
            finalQuantity
          );
        }
        if (oldItemQuantity == null) {
          finalQuantity = ItemQuantity;
          await cartHelper.updateCart(userId, vendorId, request);
        }
        let totalOrderItem = await this.totalCountOfOrderItem(userId, vendorId);
        await cartHelper.updateTotalQuantityOfOrder(
          userId,
          vendorId,
          totalOrderItem
        );
        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          message.REQUEST_SUCCESSFUL
        );
        return res.status(response.code).json(response);
      }

      if (vendorAlreadyItem == null) {
        let result = {
          menuId: request.menuId,
          quantity: request.quantity,
        };
        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          message.WENT_WRONG,
          result
        );
        response.checkDelete = "delete"; //for front end check
        return res.status(response.code).json(response);
      }
    }
  }
};

//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Delete for different item in cart
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.deleteDifferentItem = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

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
    await cartHelper.deleteDifferentItem(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Update Increament / Decrement Item in cart
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.updatePlusMinusItem = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

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
    let itemForVendorId = request.menuId;
    let vendorId = await menuHelper.findVendorByMenuId(itemForVendorId);
    await cartHelper.updateIncDec(userId, vendorId, request);
    let totalOrderItem = await this.totalCountOfOrderItem(userId, vendorId);
    await cartHelper.updateTotalQuantityOfOrder(
      userId,
      vendorId,
      totalOrderItem
    );

    let cartDetail = await cartHelper.showCartItems(userId);
    if (cartDetail.totalQuantity == 0) {
      await cartHelper.deleteDifferentItem(userId);
    }

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Show Cart Items
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.showCart = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

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
    let cartArr = [];
    let cartDetail = await cartHelper.showCartItems(userId);
    if (cartDetail != null) {
      let totalQuantity = cartDetail.totalQuantity;
      let vendor = await userHelper.findUserById(cartDetail.orderTo);
      let user = await userHelper.findUserById(cartDetail.orderBy);
      let vendorName = vendor.name;
      let userName = user.name;
      for (let i = 0; i < cartDetail.orderItem.length; i++) {
        let cartItemId = cartDetail.orderItem[i]._id;
        let cartItemTitle =
          cartDetail.orderItem[i].menuItem.menuItem.title.toString();
        let menuId = cartDetail.orderItem[i].menuItem._id;
        let cartItemPrice = cartDetail.orderItem[i].menuItem.menuItem.price;
        let cartItemDiscountPrice =
          cartDetail.orderItem[i].menuItem.menuItem.discountPrice;
        let cartItemQuantity = cartDetail.orderItem[i].quantity;

        cartArr.push({
          id: cartItemId,
          menuId: menuId,
          title: cartItemTitle,
          quantity: cartItemQuantity,
          price: cartItemPrice,
          discountPrice: cartItemDiscountPrice,
        });
      }
      let cartItems = cartArr.sort((a, b) =>
        a.title > b.title ? 1 : b.title > a.title ? -1 : 0
      );
      let result = cartItems;
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        message.REQUEST_SUCCESSFUL,
        result
      );
      response.totalQuantity = totalQuantity;
      response.vendorName = vendorName;
      response.userName = userName;
      return res.status(response.code).json(response);
    }
    if (cartDetail == null) {
      let nullArr = [];
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        message.CART_EMPTY,
        nullArr
      );

      return res.status(response.code).json(response);
    }
  }
};
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
// Delete Cart
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.deleteCart = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

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
    await cartHelper.deleteCartDetail(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//**************  Use with in Cart Controller  **************************************//
exports.totalCountOfOrderItem = async (userId, vendorId) => {
  let totalArr = [];
  let cartOrder = await cartHelper.orderItemForTotal(userId, vendorId);
  for (let i = 0; i < cartOrder.orderItem.length; i++) {
    let quantity = cartOrder.orderItem[i].quantity;
    totalArr.push(quantity);
  }
  const sum = totalArr.reduce((partial_sum, a) => partial_sum + a, 0);
  return sum;
};
