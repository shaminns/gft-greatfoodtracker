const mongoose = require("mongoose");

//Model
const cart = require("../Models/Cart");

exports.saveToCart = async (userId, vendorId, data) => {
  const cartItem = new cart({
    _id: new mongoose.Types.ObjectId(),
    orderBy: userId,
    orderTo: vendorId,
    orderItem: {
      menuItem: data.menuId,
      quantity: data.quantity,
    },
  });

  await cartItem.save();
  return true;
};

exports.vendorItemCheck = async (userId, vendorId) => {
  return await cart.findOne({
    orderBy: userId,
    orderTo: vendorId,
  });
};

exports.alreadyItemCheck = async (userId, vendorId, data) => {
  return await cart.findOne(
    {
      orderBy: userId,
      orderTo: vendorId,
      "orderItem.menuItem": data.menuId,
    },
    { "orderItem.quantity": 1, "orderItem.menuItem": 1 }
  );
};

exports.updateOldCartItem = async (userId, vendorId, data, finalQuantity) => {
  await cart.updateOne(
    {
      orderBy: userId,
      orderTo: vendorId,
    },
    { $pull: { orderItem: { menuItem: data.menuId } } }
  );

  await cart.updateOne(
    {
      orderBy: userId,
      orderTo: vendorId,
    },
    { $push: { orderItem: { menuItem: data.menuId, quantity: finalQuantity } } }
  );
  return true;
};
exports.updateCart = async (userId, vendorId, data) => {
  await cart.updateOne(
    {
      orderBy: userId,
      orderTo: vendorId,
    },
    { $push: { orderItem: { menuItem: data.menuId, quantity: data.quantity } } }
  );
  return true;
};

exports.deleteDifferentItem = async (userId) => {
  return await cart.deleteOne({ orderBy: userId });
};

exports.userAlreadyOrder = async (userId) => {
  return await cart.findOne({ orderBy: userId });
};

exports.orderItemForTotal = async (userId, vendorId) => {
  return await cart.findOne(
    { orderBy: userId, orderTo: vendorId },
    {
      orderItem: 1,
    }
  );
};

exports.updateTotalQuantityOfOrder = async (
  userId,
  vendorId,
  totalOrderItem
) => {
  return await cart.updateOne(
    { orderBy: userId, orderTo: vendorId },
    { $set: { totalQuantity: totalOrderItem } }
  );
};
exports.updateIncDec = async (userId, vendorId, data) => {
  if (data.quantity <= 0) {
    await cart.updateOne(
      {
        orderBy: userId,
        orderTo: vendorId,
      },
      { $pull: { orderItem: { menuItem: data.menuId } } }
    );
  }
  if (data.quantity > 0) {
    await cart.updateOne(
      {
        orderBy: userId,
        orderTo: vendorId,
      },
      { $pull: { orderItem: { menuItem: data.menuId } } }
    );

    await cart.updateOne(
      {
        orderBy: userId,
        orderTo: vendorId,
      },
      {
        $push: {
          orderItem: { menuItem: data.menuId, quantity: data.quantity },
        },
      }
    );
  }
  return true;
};

exports.showCartItems = async (userId) => {
  return await cart
    .findOne(
      { orderBy: userId },
      { orderItem: 1, totalQuantity: 1, orderTo: 1, orderBy: 1 }
    )
    .populate(
      "orderItem.menuItem",
      "menuItem._id menuItem.title menuItem.price menuItem.discountPrice"
    )
    .sort({
      "orderItem.menuItem": -1,
    });
};

exports.deleteCartDetail = async (userId) => {
  return await cart.deleteOne({ orderBy: userId });
};
