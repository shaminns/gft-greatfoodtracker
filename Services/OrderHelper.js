const moment = require("moment");
const fs = require("fs");

//Mongoose
const mongoose = require("mongoose");

// Model
const User = require("../Models/User");
const Menu = require("../Models/Menu");
const Order = require("../Models/Order");

//Constant
const Role = require("../Constants/Role");

//Helpers
const GeneralHelper = require("./GeneralHelper");
const SignupHelper = require("./SignupHelper");
const ResponseHelper = require("../Services/ResponseHelper");
const UserHelper = require("../Services/UserHelper");
const MenuHelper = require("../Services/MenuHelper");

//Message
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");

// exports.findUserById = async (_id) => {
//   return await User.findOne({ _id: _id });
// };
exports.addOrder = async (orderId, userId, vendorId, data) => {
  let dateTime = moment(Date.now()).format("D/MM/YYYY hh:mm");

  const order = new Order({
    _id: new mongoose.Types.ObjectId(),
    orderId: orderId,
    orderDateTime: dateTime,
    orderBy: userId,
    orderTo: vendorId,
    message: data.message,
    orderDetail: data.orderDetail,
    subTotal: data.subTotal,
    salesTax: data.salesTax,
    totalPrice: data.totalPrice,
  });

  await order.save();
  return true;
};

exports.addReadyTimeAndStatus = async (orderId, vendorId, orderTime) => {
  let order = await Order.findOne({ orderId: orderId, orderTo: vendorId });
  order.cookedTime = orderTime || order.cookedTime;
  order.deliveryStatus = process.env.PENDING_ORDER;
  order.paymentStatus = "false";
  let orderModel = new Order(order);
  return orderModel.save().then((fullfilled) => {
    return fullfilled;
  });
};

exports.setOrderStatus = async (orderId, vendorId, orderStatus) => {
  let oStatus;
  // if (oStatus == null) {
  //   let response = ResponseHelper.setResponse(
  //     ResponseCode.NOT_SUCCESS,
  //     Message.WENT_WRONG
  //   );
  //   return res.status(response.code).json(response);
  // }
  if (orderStatus == process.env.COMPLETED_ORDER) {
    oStatus = process.env.DELIVERED_ORDER;
  }
  if (orderStatus != process.env.COMPLETED_ORDER) {
    oStatus = orderStatus;
  }
  if (oStatus) {
    let order = await Order.findOne({ orderId: orderId, orderTo: vendorId });
    order.deliveryStatus = oStatus;
    let orderModel = new Order(order);
    return orderModel.save().then((fullfilled) => {
      return fullfilled;
    });
  }
};
exports.setOrderStatusAndPayment = async (vendorId, orderId) => {
  let order = await Order.findOne({ orderId: orderId, orderTo: vendorId });
  order.deliveryStatus = process.env.PROCESSED_ORDER;
  order.updateTime = moment().format("HH:mm");
  order.paymentStatus = "true";
  let orderModel = new Order(order);
  return orderModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.getVendorOrderCount = async (vendorId) => {
  let vendorCount = await Order.find({ orderTo: vendorId }).countDocuments();

  return vendorCount + 1;
};

exports.vendorPendingOrderList = async (vendorId, status, sortOrder) => {
  return await Order.find(
    {
      orderTo: vendorId,
      deliveryStatus: { $in: status },
    },
    {
      orderId: 1,
      message: 1,
      cookedTime: 1,
      deliveryStatus: 1,
      orderDateTime: 1,
      orderTo: 1,
      orderDetail: 1,
      totalPrice: 1,
      serviceFee: 1,
      paymentStatus: 1,
    }
  )
    .populate(
      "orderBy orderDetail.item",
      "name menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      createdAt: sortOrder,
    });
};
exports.vendorOngoingOrderList = async (vendorId, status, sortOrder) => {
  return await Order.find(
    {
      orderTo: vendorId,
      deliveryStatus: { $in: status },
    },
    {
      orderId: 1,
      message: 1,
      cookedTime: 1,
      deliveryStatus: 1,
      orderDateTime: 1,
      orderTo: 1,
      orderDetail: 1,
      totalPrice: 1,
      serviceFee: 1,
    }
  )
    .populate(
      "orderBy orderDetail.item",
      "name menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      updatedAt: sortOrder,
    });
};
exports.vendorCompletedOrderList = async (vendorId, status, sortOrder) => {
  return await Order.find(
    {
      orderTo: vendorId,
      deliveryStatus: { $in: status },
    },
    {
      orderId: 1,
      message: 1,
      cookedTime: 1,
      deliveryStatus: 1,
      orderDateTime: 1,
      orderTo: 1,
      orderDetail: 1,
      totalPrice: 1,
      serviceFee: 1,
    }
  )
    .populate(
      "orderBy orderDetail.item",
      "name menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      updatedAt: sortOrder,
    });
};
exports.setOrderRating = async (data, orderRating) => {
  let order = await Order.findOne({
    orderId: data.orderId,
    orderTo: data.vendorId,
  });

  order.rating = orderRating;

  let orderModel = new Order(order);
  return orderModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.showReceivePayment = async (vendorId) => {
  return await Order.find(
    {
      orderTo: vendorId,
      deliveryStatus: {
        $in: [process.env.COMPLETED_ORDER, process.env.DELIVERED_ORDER],
      },
    },
    {
      orderId: 1,
      orderDateTime: 1,
      totalPrice: 1,
      deliveryStatus: 1,
      createdAt: 1,
      updatedAt: 1,
    }
  ).populate("orderBy", "name");
};
exports.showUserOrder = async (userId, data) => {
  return await Order.findOne(
    {
      orderBy: userId,
      orderTo: data.vendorId,
      orderId: data.orderId,
    },
    {
      orderTo: 1,
      orderBy: 1,
      orderId: 1,
      deliveryStatus: 1,
      cookedTime: 1,
      orderDetail: 1,
      createdAt: 1,
      updatedAt: 1,
      updateTime: 1,
    }
  )
    .populate(
      "orderTo orderDetail.item",
      "name menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      createdAt: -1,
    });
};
exports.userActiveMyOrders = async (userId, status) => {
  return await Order.find(
    {
      orderBy: userId,
      deliveryStatus: { $in: status },
    },
    {
      _id: 0,
      orderTo: 1,
      orderId: 1,
      cookedTime: 1,
      totalPrice: 1,
      createdAt: 1,
      updatedAt: 1,
      deliveryStatus: 1,
      paymentStatus: 1,
    }
  )
    .populate("orderTo", "name  ")
    .sort({
      createdAt: -1,
    });
};
exports.userPastMyOrders = async (userId, status) => {
  // let aa = await Order.aggregate([
  //   { $project: { items: { $size: "$orderDetail" } } },
  // ]);
  // console.log(aa);
  return await Order.find(
    {
      orderBy: userId,
      deliveryStatus: { $in: status },
    },
    {
      _id: 0,
      orderTo: 1,
      orderId: 1,
      totalPrice: 1,
      deliveryStatus: 1,
      orderDateTime: 1,
      orderDetail: 1,
      rating: 1,
      createdAt: 1,
      updatedAt: 1,
      paymentStatus: 1,
    }
  )
    .populate("orderTo", "name  ")
    .sort({
      createdAt: -1,
    });
};
exports.showUserRatedOrders = async (userId, status) => {
  return await Order.find(
    {
      orderBy: userId,
      deliveryStatus: { $in: status },
    },
    {
      _id: 0,
      orderTo: 1,
      orderId: 1,
      orderDateTime: 1,
      rating: 1,
      createdAt: 1,
      updatedAt: 1,
    }
  ).populate("orderTo", "name  ");
};
exports.showUserOrderDetail = async (orderBy, data) => {
  return await Order.findOne(
    {
      orderBy: orderBy,
      orderTo: data.vendorId,
      orderId: data.orderId,
    },
    {
      _id: 0,
      orderTo: 1,
      orderBy: 1,
      orderId: 1,
      orderDateTime: 1,
      orderDetail: 1,
      subTotal: 1,
      serviceFee: 1,
      salesTax: 1,
      totalPrice: 1,
      deliveryStatus: 1,
      createdAt: 1,
      updatedAt: 1,
      paymentStatus: 1,
    }
  ).populate(
    "orderTo orderDetail.item",
    "name menuItem.title menuItem.price menuItem.discountPrice"
  );
};
exports.findVendorOrderByOrderId = async (vendorId, orderId) => {
  return await Order.findOne(
    {
      orderTo: vendorId,
      orderId: orderId,
    },
    {
      _id: 0,
      orderTo: 1,
      orderBy: 1,
      orderId: 1,
      orderDateTime: 1,
      orderDetail: 1,
      subTotal: 1,
      serviceFee: 1,
      salesTax: 1,
      totalPrice: 1,
      deliveryStatus: 1,
      createdAt: 1,
      updatedAt: 1,
      cookedTime: 1,
      paymentStatus: 1,
    }
  ).populate(
    "orderTo orderDetail.item",
    "name menuItem.title menuItem.price menuItem.discountPrice"
  );
};
exports.updateOrderCalculation = async (data) => {
  let order = await Order.findOne({
    orderId: data.orderId,
    orderTo: data.orderTo,
  });
  order.subTotal = data.subTotal;
  order.salesTax = data.salesTax;
  order.totalPrice = data.totalPrice;
  let orderModel = new Order(order);
  return orderModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
exports.orderStatusForReopen = async (userId) => {
  let status = [process.env.COMPLETED_ORDER, process.env.DELIVERED_ORDER];
  return await Order.find({
    orderBy: userId,
    deliveryStatus: { $in: status },
    rating: -1,
  }).sort({ createdAt: -1 });
};
exports.orderStatusForRating = async (userId) => {
  let status = [process.env.COMPLETED_ORDER, process.env.DELIVERED_ORDER];
  return await Order.find({
    orderBy: userId,
    rating: "-1",
    deliveryStatus: { $in: status },
  })
    .populate(
      "orderTo orderBy orderDetail.item",
      "name name menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      updatedAt: -1,
    });
};
exports.setMessage = async (data) => {
  return await Order.updateOne(
    { orderId: data.orderId, orderTo: data.vendorId },
    { $set: { message: "" } }
  );
};
exports.pendingOrderList = async () => {
  return await Order.find(
    {
      deliveryStatus: process.env.PENDING_ORDER,
      paymentStatus: { $in: ["", "false"] },
    },
    {
      orderId: 1,
      message: 1,
      cookedTime: 1,
      deliveryStatus: 1,
      orderDateTime: 1,
      orderTo: 1,
      orderDetail: 1,
      totalPrice: 1,
      serviceFee: 1,
      paymentStatus: 1,
      updatedAt: 1,
      createdAt: 1,
    }
  )
    .populate(
      "orderBy orderDetail.item",
      "name menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      createdAt: -1,
    });
};
