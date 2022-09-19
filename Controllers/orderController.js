const stripe = require("stripe");
const moment = require("moment");
const cron = require("node-cron");
//Controller
const PaymentController = require("../Controllers/PaymentController");
// Helpers
const responseHelper = require("../Services/ResponseHelper");
const menuHelper = require("../Services/MenuHelper");
const orderHelper = require("../Services/OrderHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const userHelper = require("../Services/UserHelper");
const notificationHelper = require("../Services/NotificationHelper");
const creditCardHelper = require("../Services/CreditCardHelper");
// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");
// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");
const mongoose = require("mongoose");
//********************************************************************************
// Add Order for User
//********************************************************************************
exports.addOrder = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
  let token = req.headers.authorization;
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  let priceArr = [];

  let request = req.body;
  if (userId != null) {
    // let userDetail = await userHelper.findUserById(userId);
    // let userEmail = userDetail.email;
    // let userName = userDetail.name;

    for (const [key, value] of Object.entries(request.orderDetail)) {
      priceArr.push(value);
    }
    // let cardResult = await creditCardHelper.findCardByUserId(
    //   userId,
    //   request.cardNo
    // );
    // if (cardResult == null) {
    //   response = responseHelper.setResponse(
    //     responseCode.NOT_SUCCESS,
    //     Message.CARD_NOT_FOUND
    //   );
    //   return res.status(response.code).json(response);
    // }
    // // console.log(req.body);
    // let cardExpiryMonth;
    // let cardExpiryYear;
    // if (cardResult != null) {
    //   let cardExpiryDate = cardResult.expiryDate;
    //   let cardExpiryArr = cardExpiryDate.split("/");
    //   cardExpiryMonth = cardExpiryArr[0];
    //   cardExpiryYear = cardExpiryArr[1];
    // }
    // let stripeKey 
    let vendorId = await menuHelper.findVendorByMenuId(priceArr[0].item);
    // let vendorDetail = await userHelper.findUserById(vendorId);
    // let vendorName = vendorDetail.name;
    // let vendorEmail = vendorDetail.email;
    let orderId = await orderHelper.getVendorOrderCount(vendorId);
    // let userSecretKey = vendorDetail.stripeDetail.secretKey;

    // let vendorStripeObj = {
    //   stripeKey: userSecretKey.toString(),
    //   cardNo: request.cardNo,
    //   cardExpiryMonth: cardExpiryMonth,
    //   cardExpiryYear: cardExpiryYear,
    //   cardCvc: cardResult.cvvCode,
    //   userEmail: userEmail,
    //   name: userName,
    //   orderAmmount: (request.totalPrice - 1) * 100,
    //   orderId: orderId, //orderId
    //   //vendorId: vendorId,
    //   currency: "usd",
    //   //userId: userId,
    //   userName: userName,
    //   userEmail: userEmail,
    // };
    // let adminStripeObj = {
    //   stripeKey: stripeKey.toString(),
    //   cardNo: request.cardNo,
    //   cardExpiryMonth: cardExpiryMonth,
    //   cardExpiryYear: cardExpiryYear,
    //   cardCvc: cardResult.cvvCode,
    //   userEmail: userEmail,
    //   name: userName,
    //   orderAmmount: 1 * 100,
    //   totalAmount: request.totalPrice - 1,
    //   orderId: orderId, //orderId
    //   //vendorId: vendorId,
    //   vendorName: vendorName,
    //   vendorEmail: vendorEmail,
    //   currency: "usd",
    //   //userId: userId,
    //   userName: userName,
    //   userEmail: userEmail,
    // };
    // // await this.stripePayment(req, res, foodieStripeObj)
    // //   .then(await this.stripePayment(req, res, vendorStripeObj))
    // //   .catch(console.log("err"));
    // try {
    //   await this.stripePayment(req, res, vendorStripeObj);
    //   await this.stripePayment(req, res, adminStripeObj);
    //   console.log("Success both Stripe calls");
    // } catch (error) {
    //   console.log(error);
    // }
    await orderHelper.addOrder(orderId, userId, vendorId, request);
    let userData = await userHelper.findUserById(vendorId);
    let notification = {
      title: "New Order Alert! - GFT",
      body: "You received an order. Please checkout Pending Orders",
    };
    let data = {
      orderStatus: process.env.PENDING_ORDER,
      vendorId: vendorId,
      orderId: orderId,
    };
    // console.log(userData.deviceToken, notification, data);
    await notificationHelper.sendPushNotification(
      userData.deviceToken,
      notification,
      data
    );
    let result = await orderHelper.findVendorOrderByOrderId(vendorId, orderId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    // response.aa = userData;
    // response.bb = notification;
    // response.cc = data;
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Set Time for Ready Order and Status (for vendor)
//********************************************************************************
exports.setReadyTimeAndStatus = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
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
  let orderId = req.body.orderId;
  let orderTime = req.body.orderTime;
  let notification, data;
  let orderDetail = await orderHelper.findVendorOrderByOrderId(
    vendorId,
    orderId
  );
  let totalAmount = orderDetail.totalPrice;
  if (!orderTime) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.SELECT_COOKED_TIME
    );
    return res.status(response.code).json(response);
  }
  if ((orderId, orderTime)) {
    await orderHelper.addReadyTimeAndStatus(orderId, vendorId, orderTime);
    let userDetailForId = await orderHelper.findVendorOrderByOrderId(
      vendorId,
      orderId
    );
    let userId = userDetailForId.orderBy;
    let userData = await userHelper.findUserById(userId);
    let vendorData = await userHelper.findUserById(vendorId);
    let vendorName = vendorData.name;
    let userName = userData.name;
    let orderData = {
      userId,
      userName,
      vendorId,
      vendorName,
      totalAmount,
      orderId,
      orderTime,
    };

    notification = {
      title: "Order has been accepted",
      body:
        "Please pay your total bill $" +
        totalAmount +
        " for preparing your order",
    };

    data = {
      orderStatus: process.env.PENDING_ORDER,
      paymentStatu: "false",
      vendorId: vendorId,
      vendorName: vendorName,
      orderId: orderId,
      totalAmount: totalAmount,
    };
    await notificationHelper.sendPushNotification(
      userData.deviceToken,
      notification,
      data
    );
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      orderData
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Paymet for Order for User
//********************************************************************************
exports.orderPayment = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  // Get Token
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
    let cardResult = await creditCardHelper.findCardByUserId(
      userId,
      request.cardNo
    );
    if (cardResult == null) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.CARD_NOT_FOUND
      );
      return res.status(response.code).json(response);
    }
    // console.log(req.body);
    let cardExpiryMonth;
    let cardExpiryYear;
    if (cardResult != null) {
      let cardExpiryDate = cardResult.expiryDate;
      let cardExpiryArr = cardExpiryDate.split("/");
      cardExpiryMonth = cardExpiryArr[0];
      cardExpiryYear = cardExpiryArr[1];
    }
    let stripeKey = process.env.STRIPE_SECRET_KEY;
    let userDetail = await userHelper.findUserById(userId);
    let userEmail = userDetail.email;
    let userName = userDetail.name;
    let vendorId = request.vendorId;
    let vendorDetail = await userHelper.findUserById(vendorId);
    let vendorName = vendorDetail.name;
    let vendorEmail = vendorDetail.email;
    // let orderId = await orderHelper.getVendorOrderCount(vendorId);
    let orderId = request.orderId;
    let vendorSecretKey = vendorDetail.stripeDetail.secretKey;

    let vendorStripeObj = {
      stripeKey: vendorSecretKey.toString(),
      cardNo: request.cardNo,
      cardExpiryMonth: cardExpiryMonth,
      cardExpiryYear: cardExpiryYear,
      cardCvc: cardResult.cvvCode,
      userEmail: userEmail,
      name: userName,
      orderAmmount: (request.totalPrice - 1) * 100,
      orderId: orderId, //orderId
      //vendorId: vendorId,
      currency: "usd",
      //userId: userId,
      userName: userName,
      userEmail: userEmail,
    };
    let adminStripeObj = {
      stripeKey: stripeKey.toString(),
      cardNo: request.cardNo,
      cardExpiryMonth: cardExpiryMonth,
      cardExpiryYear: cardExpiryYear,
      cardCvc: cardResult.cvvCode,
      userEmail: userEmail,
      name: userName,
      orderAmmount: 1 * 100,
      totalAmount: request.totalPrice - 1,
      orderId: orderId, //orderId
      //vendorId: vendorId,
      vendorName: vendorName,
      vendorEmail: vendorEmail,
      currency: "usd",
      //userId: userId,
      userName: userName,
      userEmail: userEmail,
    };
    // await this.stripePayment(req, res, foodieStripeObj)
    //   .then(await this.stripePayment(req, res, vendorStripeObj))
    //   .catch(console.log("err"));

    try {
      await this.stripePayment(req, res, adminStripeObj);
      console.log("After 1st Stripe call");
    } catch (error) {
      console.log("errr!!!!!!!!");
      return false;
    }
    try {
      await this.stripePayment(req, res, vendorStripeObj);
      console.log("After 2nd Stripe call");
    } catch (error) {
      console.log("errr!!!!!!!!");
      return false;
    }
    // await orderHelper.addOrder(orderId, userId, vendorId, obj);
    await orderHelper.setOrderStatusAndPayment(vendorId, orderId);
    //vendor notification
    let vendorData = await userHelper.findUserById(vendorId);
    let vendorNotification = {
      title: "Payment Confirmed - GFT",
      body:
        "Payment has been Successfull. Please Checkout Order ID : " +
        orderId +
        " in Ongoing Orders",
    };
    let vendorNotificationData = {
      orderStatus: process.env.PENDING_ORDER,
      vendorId: vendorId,
      orderId: orderId,
    };

    await notificationHelper.sendPushNotification(
      vendorData.deviceToken,
      vendorNotification,
      vendorNotificationData
    );

    // user notification
    let orderData = await orderHelper.findVendorOrderByOrderId(
      vendorId,
      orderId
    );
    let orderTime = orderData.cookedTime;
    let userData = await userHelper.findUserById(userId);
    let userNotification = {
      title: "Preparing Your Order!",
      body:
        "Preparing your food. You can track the location and enjoy it once. Estimated Ready Time is " +
        orderTime,
    };
    userNotificationData = {
      orderStatus: process.env.PROCESSED_ORDER,
      vendorId: vendorId,
      orderId: orderId,
    };

    await notificationHelper.sendPushNotification(
      userData.deviceToken,
      userNotification,
      userNotificationData
    );
    let result = await orderHelper.findVendorOrderByOrderId(vendorId, orderId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    // response.aa = userData;
    // response.bb = userNotification;
    // response.cc = userNotificationData;
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Set Order Status (for vendor)
//********************************************************************************
exports.setOrderStatus = async (req, res, next) => {
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
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  let orderId = req.body.orderId;
  let orderStatus = req.body.orderStatus;
  let notification, data;
  await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
  let userDetailForId = await orderHelper.findVendorOrderByOrderId(
    vendorId,
    orderId
  );
  let userId = userDetailForId.orderBy;
  let userData = await userHelper.findUserById(userId);
  if (orderStatus == process.env.READY_ORDER) {
    notification = {
      title: "Order is Ready!",
      body: "Your order is ready. Pick it up at the restaurant (ASAP)",
    };
    data = {
      orderStatus: process.env.READY_ORDER,
      vendorId: vendorId,
      orderId: orderId,
    };
    // console.log(userData.deviceToken, notification, data);
  }
  if (orderStatus == process.env.COMPLETED_ORDER) {
    notification = {
      title: "Order has been Completed!",
      body: "Thank You for being our valued customer. Please rate your order for feedback",
    };
    data = {
      orderStatus: process.env.COMPLETED_ORDER,
      vendorId: vendorId,
      orderId: orderId,
    };
    // console.log(userData.deviceToken, notification, data);
  }
  if (orderStatus == process.env.CANCELLED_ORDER) {
    notification = {
      title: "Your order has been Cancelled!",
      body: "Sorry! Your Order has been cancelled",
    };
    data = {
      orderStatus: process.env.CANCELLED_ORDER,
      vendorId: vendorId,
      orderId: orderId,
    };
    console.log(userData.deviceToken, notification, data);
  }
  await notificationHelper.sendPushNotification(
    userData.deviceToken,
    notification,
    data
  );
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Get Vendor's Pending Order List
//********************************************************************************
exports.getVendorPendingOrder = async (req, res, next) => {
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
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let result = await orderHelper.vendorPendingOrderList(
      vendorId,
      [process.env.PENDING_ORDER],
      -1
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
// Get Vendor's Ongoing (Processed/Ready) Order List
//********************************************************************************
exports.getVendorProcessedReadyOrder = async (req, res, next) => {
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
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let result = await orderHelper.vendorOngoingOrderList(
      vendorId,
      [process.env.PROCESSED_ORDER, process.env.READY_ORDER],
      -1
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
// Get Vendor's Comleted / Cancelled Order List
//********************************************************************************
exports.getVendorCompletedOrder = async (req, res, next) => {
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
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (vendorId != null) {
    let result = await orderHelper.vendorCompletedOrderList(
      vendorId,
      [
        process.env.COMPLETED_ORDER,
        process.env.CANCELLED_ORDER,
        process.env.DELIVERED_ORDER,
      ],
      -1
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
// Get User's Order Status - Cancelled/Ready/Completed
//********************************************************************************
exports.getUserOrder = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    request.vendorId = mongoose.Types.ObjectId(request.vendorId);
    let result = await orderHelper.showUserOrder(userId, request);
    let startTime = result.updateTime;
    let nowTime = moment().format("HH:mm").toString();
    var start = moment.duration(startTime, "HH:mm");
    var end = moment.duration(nowTime, "HH:mm");
    var diff = end.subtract(start);
    let hours = ("hh", diff.hours()).toString();
    let finalHour;
    if (hours.length < 2) {
      finalHour = "0" + hours;
    }
    if (hours.length >= 2) {
      finalHour = hours;
    }
    let minutes = ("mm", diff.minutes()).toString();
    let finalMinute;
    if (minutes.length < 2) {
      finalMinute = "0" + minutes;
    }
    if (minutes.length >= 2) {
      finalMinute = minutes;
    }
    let finalDifference = finalHour + ":" + finalMinute;
    let timeSt = moment(finalDifference, "HH:mm");
    let minDifference = moment.duration(timeSt.format("HH:mm")).asMinutes();
    //cooked time
    if (result.cookedTime) {
      let cTime = result.cookedTime.toString();
      let finalCookTime;
      if (cTime.length == 1) {
        finalCookTime = "00:0" + cTime;
      }
      if (cTime.length == 2) {
        finalCookTime = "00:" + cTime;
      }
      if (cTime.length >= 3) {
        finalCookTime = cTime;
      }
      let cookTimeForMin = moment(finalCookTime, "HH:mm");
      let minCookDifference = moment
        .duration(cookTimeForMin.format("HH:mm"))
        .asMinutes();
      let remainingTimeStatus;
      let timeDif = minCookDifference - minDifference;
      if (timeDif > 0) {
        remainingTimeStatus = true;
      }
      if (timeDif <= 0) {
        remainingTimeStatus = false;
      }
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        result
      );
      response.remainingTimeStatus = remainingTimeStatus;
      response.cookedTimeinMins = minCookDifference;
      response.minDifferenceUpdateToNow = minDifference;
    } else {
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        result
      );
      //Todo : @waheeb kindly fix that issue and remove hardcoded values this is the case if cookedTime is null
      response.remainingTimeStatus = 0;
      response.cookedTimeinMins = 0;
      response.minDifferenceUpdateToNow = 0;
    }
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Get User's Active - My Order
//********************************************************************************
exports.userActiveMyOrders = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let result = await orderHelper.userActiveMyOrders(userId, [
      process.env.PENDING_ORDER,
      process.env.PROCESSED_ORDER,
      process.env.READY_ORDER,
    ]);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Get User's Past - My Order
//********************************************************************************
exports.userPastMyOrders = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let result = await orderHelper.userPastMyOrders(userId, [
      process.env.COMPLETED_ORDER,
      process.env.CANCELLED_ORDER,
      process.env.DELIVERED_ORDER,
    ]);
    let arr = [];
    let orderRecord, totalItems, orderItems, openCloseStatus;
    if (result) {
      for (let i = 0; i < result.length; i++) {
        orderRecord = result[i];
        totalItems = result[i].orderDetail.length;
        orderItems = result[i].orderDetail;
        let vendorId = orderRecord.orderTo._id;
        let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
          vendorId
        );
        let openTime = vendorDetail.servingHours.openTime;
        let closeTime = vendorDetail.servingHours.closeTime;
        var format = "HH:mm";
        var time = moment();
        (beforeTime = moment(openTime, format)),
          (afterTime = moment(closeTime, format));
        if (time.isBetween(beforeTime, afterTime)) {
          openCloseStatus = "Open";
        } else {
          openCloseStatus = "Close";
        }
        finalResult = Object.assign(
          { orderRecord: orderRecord },
          { totalItems: totalItems },
          { orderItems: orderItems },
          { openCloseStatus: openCloseStatus }
        );
        arr.push(finalResult);
      }
    }
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    response.result = arr;
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Get User's Rated Orders
//********************************************************************************
exports.userRatedOrders = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let result = await orderHelper.showUserRatedOrders(userId, [
      process.env.COMPLETED_ORDER,
      process.env.CANCELLED_ORDER,
      process.env.DELIVERED_ORDER,
    ]);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Get User's Order Detail
//********************************************************************************
exports.userOrderDetail = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let result = await orderHelper.showUserOrderDetail(userId, request);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Save Order Calculation (for user)
//********************************************************************************
exports.saveOrderCalculation = async (req, res, next) => {
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
  let userId = await tokenExtractor.getInfoFromToken(token);
  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    await orderHelper.updateOrderCalculation(request);
    let result = await orderHelper.findVendorOrderByOrderId(
      request.orderTo,
      request.orderId
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
// Is Order Status (for user)
//********************************************************************************
exports.orderStatusForReopen = async (req, res, next) => {
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
    let result;
    let orderDetail = await orderHelper.orderStatusForReopen(userId);
    if (orderDetail.length == 0) {
      result = false;
    }
    if (orderDetail.length != 0) {
      result = true;
    }
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    if (orderDetail.length != 0) {
      response.orderTo = orderDetail[0].orderTo;
      response.orderId = orderDetail[0].orderId;
      response.totalOrders = orderDetail.length;
    }
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Is Order Completed (for user rating)
//********************************************************************************
exports.orderStatusForRating = async (req, res, next) => {
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
    let result = await orderHelper.orderStatusForRating(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result[0]
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// set message for backend (null)
//********************************************************************************
exports.setMessageForBackend = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  await orderHelper.setMessage(request);
  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Auto Cencel Order after 15 min
//********************************************************************************
cron.schedule("*/3 * * * *", () => {
  this.pendingList();
});
exports.pendingList = async (req, res) => {
  let orderList = await orderHelper.pendingOrderList();

  if (orderList != null) {
    for (let i = 0; i < orderList.length; i++) {
      let vendorId = orderList[i].orderTo;
      let vendorDetail = await userHelper.findUserById(vendorId);
      let vendorDeviceToken = vendorDetail.deviceToken;
      let userId = orderList[i].orderBy._id;
      let userDetail = await userHelper.findUserById(userId);
      let userDeviceToken = userDetail.deviceToken;
      let orderId = orderList[i].orderId;
      let orderStatus = process.env.CANCELLED_ORDER;

      let minuteDurration = moment(
        orderList[i].updatedAt,
        "yyyy-MM-dd hh:mm:ss a"
      ).fromNow();

      if (minuteDurration.includes("minute") == true) {
        console.log("minuteDurration : ", minuteDurration);
        if (minuteDurration != "a minute ago") {
          let min = minuteDurration.match(/\d+/)[0];
          console.log("min : ", min);
          //15 min
          if (min >= 10) {
            // console.log("order updated!!!!!!!!!!!!!!!!!");
            await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
            //vendor notification
            vendorNotification = {
              title: "Order has been Cancelled!",
              body: "Sorry! Order has been Cancelled due to not Accepted or Pending Payment",
            };
            vendorNotificationData = {
              orderStatus: process.env.CANCELLED_ORDER,
              vendorId: vendorId,
              orderId: orderId,
            };

            if (vendorDeviceToken != "") {
              await notificationHelper.sendPushNotification(
                vendorDeviceToken,
                vendorNotification,
                vendorNotificationData
              );
            }
            //user notification
            userNotification = {
              title: "Order has been Cancelled!",
              body: "Sorry! Order has been Cancelled due to not Accepted or Pending Payment",
            };
            userNotificationData = {
              orderStatus: process.env.CANCELLED_ORDER,
              vendorId: vendorId,
              orderId: orderId,
            };

            if (userDeviceToken != "") {
              await notificationHelper.sendPushNotification(
                userDeviceToken,
                userNotification,
                userNotificationData
              );
            }
          }

          if (minuteDurration.includes("hour") == true) {
            console.log("order updated h");
            await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
          }
          if (minuteDurration.includes("day") == true) {
            console.log("order updated d");
            await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
          }
        }
      }
    }
  }
  if (orderList.length == 0) {
    console.log("No pending Order for Cencel !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }
};
// //////////////////////////////////////////////////////////
////use with in order controller
////////////////////////////////////////////////////////////
exports.stripePayment = async (req, res, data) => {
  let totalAmount;
  let vendorName;
  let vendorEmail;
  let vendorStr;
  let amountStr;
  if (data.totalAmount) {
    totalAmount = data.totalAmount;
    amountStr = " + $" + totalAmount;
  } else {
    totalAmount = "";
    amountStr = "";
  }
  if (data.vendorName) {
    vendorName = data.vendorName;
    vendorEmail = data.vendorEmail;
    vendorStr = " - vendor : " + vendorName + " (" + vendorEmail + ")";
  } else {
    vendorStr = "";
  }
  let stripeObj = {
    stripeKey: data.stripeKey,
    cardNo: data.cardNo,
    cardExpiryMonth: data.cardExpiryMonth,
    cardExpiryYear: data.cardExpiryYear,
    cardCvc: data.cardCvc,
    userEmail: data.userEmail,
    name: data.name,
    orderAmmount: data.orderAmmount,
    totalAmount: totalAmount,
    orderId: data.orderId,
    vendorName: data.vendorName,
    vendorEmail: data.vendorEmail,
    currency: data.currency,
    userName: data.userName,
    userEmail: data.userEmail,
  };
  let sCardNo = stripeObj.cardNo.toString();
  let errMessageStr;
  let response = responseHelper.getDefaultResponse();
  let stripeToken;
  let Secret_Key = stripeObj.stripeKey.toString();
  const stripe = require("stripe")(Secret_Key);
  await stripe.tokens
    .create({
      card: {
        number: sCardNo,
        exp_month: stripeObj.cardExpiryMonth,
        exp_year: stripeObj.cardExpiryYear,
        cvc: stripeObj.cardCvc.toString(),
      },
    })
    .then((result) => {
      stripeToken = result.id;
    })
    .catch((err) => {
      switch (err.type) {
        case "StripeCardError":
          // A declined card error,  invalid card detail
          errMessageStr = err.message;
        case "StripeRateLimitError":
          // Too many requests made to the API too quickly
          errMessageStr = err.message;
        case "StripeInvalidRequestError":
          // Invalid parameters were supplied to Stripe's API
          errMessageStr = err.message;
        case "StripeAPIError":
          // An error occurred internally with Stripe's API
          errMessageStr = err.message;
        case "StripeConnectionError":
          // Some kind of error occurred during the HTTPS communication
          errMessageStr = err.message;
        case "StripeAuthenticationError":
          // You probably used an incorrect API key
          errMessageStr = err.message;
        default:
          // Handle any other types of unexpected errors
          errMessageStr = err.message;
      }
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        errMessageStr
      );
      return res.status(response.code).json(response);
    });
  stripe.customers
    .create({
      email: stripeObj.userEmail,
      source: stripeToken,
      name: stripeObj.name,
      // address: {
      //   line1: "TC 9/4 Old MES colony",
      //   postal_code: "110092",
      //   city: "New Delhi",
      //   state: "Delhi",
      //   country: "India",
      // },
    })
    .then((customer) => {
      return stripe.charges.create({
        amount: stripeObj.orderAmmount,
        description:
          "orderId : " +
          stripeObj.orderId +
          vendorStr +
          " - foodie : " +
          stripeObj.userName +
          " (" +
          stripeObj.userEmail +
          ")" +
          " - totalAmount : $" +
          stripeObj.orderAmmount / 100 +
          amountStr,
        currency: stripeObj.currency,
        customer: customer.id,
      });
    })
    .then((charge) => {
      console.log("Success Payment");
      // console.log("wwww", charge);
      //   res.send("Success"); // If no error occurs
      // return charge;
    })
    .catch((err) => {
      //   res.send(err); // If some error occurs
      // console.log("EEEEEEEEEEEEEEE", err);
      // return err;
      console.log("Error Payment");
    });
};
