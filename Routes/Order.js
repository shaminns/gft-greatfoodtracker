//Express Router
const express = require("express");
const router = express.Router();

//Controllers
const orderController = require("../Controllers/orderController");

//Routes

router.post("/addOrder", orderController.addOrder);
router.post("/setReadyTimeAndStatus", orderController.setReadyTimeAndStatus);
router.post("/orderPayment", orderController.orderPayment);
router.post("/setOrderStatus", orderController.setOrderStatus);
router.post("/getVendorPendingOrder", orderController.getVendorPendingOrder);
router.post(
  "/getVendorProcessedReadyOrder",
  orderController.getVendorProcessedReadyOrder
);
router.post(
  "/getVendorCompletedOrder",
  orderController.getVendorCompletedOrder
);
router.post("/getUserOrder", orderController.getUserOrder);
router.post("/userActiveMyOrders", orderController.userActiveMyOrders);
router.post("/userPastMyOrder", orderController.userPastMyOrders);
router.post("/userRatedOrders", orderController.userRatedOrders);
router.post("/userOrderDetail", orderController.userOrderDetail);
router.post("/saveOrderCalculation", orderController.saveOrderCalculation);
router.post("/orderStatusForReopen", orderController.orderStatusForReopen);
router.post("/orderStatusForRating", orderController.orderStatusForRating);
router.post("/setMessageForBackend", orderController.setMessageForBackend);

module.exports = router;
