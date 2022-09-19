//Express Router
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

//Midlewares
const jwtAuth = require("../Middleware/JWTAuth");

//Controllers
const creditCardController = require("../Controllers/creditCardController");
//Routes

router.post("/addCard", creditCardController.addCreditCard);
router.post("/addCardForUser", creditCardController.addCardForUser);
router.post("/showAllCardsForUser", creditCardController.showAllCardsForUser);
router.post(
  "/deleteUserVendorCreditCard",
  creditCardController.deleteUserVendorCreditCard
);
router.post("/showCreditCard", creditCardController.showCreditCard);
module.exports = router;
