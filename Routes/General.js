//Express Router
const express = require("express");
const router = express.Router();
//Controllers
const generalController = require("../Controllers/generalController.js");

//Routes

router.post("/collectData", generalController.collectData);
router.post("/login", generalController.login);
router.post("/forgotpasswordcode", generalController.forgotpasswordcode);
router.post("/forgotpassword", generalController.forgotpassword);
router.post("/resetpassword", generalController.resetpassword);
router.post("/deleteDeviceToken", generalController.deleteDeviceToken);

router.post("/setLocation", generalController.setLocation);
router.post("/getLocation", generalController.getLocation);
router.post("/getUserList", generalController.getUserList);

router.post("/setRating", generalController.setRating);
router.post("/getRating", generalController.getRating);

router.post("/gftfilter", generalController.gftfilter);
router.post("/gftSearch", generalController.gftSearch);
router.get("/gftLocationSearch", generalController.gftLocationSearch);
router.post("/gftResturantSearch", generalController.gftResturantSearch);
router.post(
  "/gftResturantSearchForSearchBox",
  generalController.gftResturantSearchForSearchBox
);
router.post("/blockCheck", generalController.isBlock);
router.post("/showCreditCard", generalController.showCreditCard);
router.post("/updateCreditCard", generalController.updateCreditCard);
router.post("/updateDeviceToken", generalController.updateDeviceToken);
//
//// for developers
router.post("/backEndDeleteUser", generalController.backEndDeleteUser);

module.exports = router;
