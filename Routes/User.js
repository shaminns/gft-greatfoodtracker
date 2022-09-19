//Express Router
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

//Controllers
const userController = require("../Controllers/userController");
const vendorController = require("../Controllers/vendorController");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/UserImages/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

//will be using this for uplading
const upload = multer({ storage: storage });

//Routes
router.post("/saveUserRecord", userController.saveRecord);
router.post("/showUserBasicInfo", userController.showUserBasicInfo);
router.post("/updateUser", userController.updateUser);
router.post("/updatelocation", userController.updatelocation);
router.post("/findAllVendors", vendorController.findAllVendors);
router.post("/addFavouriteVendor", userController.addFavouriteVendor);
router.post("/deleteFavouriteVendor", userController.deleteFavouriteVendor);
router.post(
  "/updateUserProfileImage",
  upload.single("profileImage"),
  userController.updateUserProfileImage
);
router.post("/addUpdateAccountDetail", userController.addUpdateAccountDetail);
router.post("/showFavoriteForUser", userController.showFavoriteForUser);
router.post("/getVendorDetailForUser", userController.getVendorDetailForUser);

router.post("/updateStripeDetail", userController.updateStripeDetail);

router.post("/isAppleUser", userController.checkAppleUser);
router.post("/updateAppleUser", userController.updateAppleUser);

module.exports = router;
