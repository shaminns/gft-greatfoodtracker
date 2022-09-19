const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    orderId: { type: String, default: null },
    orderDateTime: { type: String },
    orderBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    orderTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, default: "" },
    orderDetail: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
        qty: { type: Number },
        price: { type: Number },
      },
    ],
    rating: { type: String, default: -1, max: 1 },
    cookedTime: { type: String, default: "" },
    deliveryStatus: { type: String, default: "Pending" },
    subTotal: { type: Number, default: 0.0 },
    serviceFee: { type: Number, default: process.env.SERVICE_FEE },
    salesTax: { type: Number, default: 0.0 },
    totalPrice: { type: Number, default: 0.0 },
    paymentStatus: { type: String, default: "" },
    updateTime: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
