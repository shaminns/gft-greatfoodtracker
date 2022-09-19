//Express Router
const express = require("express");
const router = express.Router();

//Controllers
const paracticeController = require("../Controllers/paracticeController");

//Routes

router.post("/setRating", paracticeController.setRating);
router.post("/getRating", paracticeController.getRating);
router.post("/testStripe", paracticeController.testStripe);
router.post("/testStripeTransfer", paracticeController.testStripeTransfer);
router.post("/cardTest", paracticeController.cardTest);
router.post("/pendingList", paracticeController.testPendingList);
router.post("/elasticSearch", paracticeController.elasticSearch);
module.exports = router;
