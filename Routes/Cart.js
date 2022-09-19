const express = require("express");
const router = express.Router();

// Controller
const cartController = require("../Controllers/cartController");

// Routes
router.post("/addToCart", cartController.addToCart);
router.post("/deleteDifferentItem", cartController.deleteDifferentItem);
router.post("/updatePlusMinusItem", cartController.updatePlusMinusItem);
router.post("/showCart", cartController.showCart);
router.post("/deleteCart", cartController.deleteCart);

module.exports = router;
