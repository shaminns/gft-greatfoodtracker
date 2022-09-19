//Express Router
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

//Midlewares
const jwtAuth = require("../Middleware/JWTAuth");

//Controllers
const vendorController = require("../Controllers/vendorController");
const vendorDetailController = require("../Controllers/vendorDetailController");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/VendorImages/");
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
router.post("/saveVendorRecord", vendorController.saveRecord);
router.post("/updateVendor", vendorController.updateVendor);
router.post("/viewvendorprofile", vendorController.viewVendorProfile);
router.post("/getVendorLocation", vendorController.getVendorLocation);
router.post("/getVendorDetail", vendorController.getVendorDetail);
router.post("/buyPackage", vendorController.buyPackage);
router.post("/addTagAndDetail", vendorDetailController.addTagAndDetail);
router.post("/updateSearchTag", vendorDetailController.updateSearchTag);
router.post(
  "/addImage",
  upload.single("profileImage"),
  vendorController.addVendorImage
);
router.post(
  "/addVendorCover",
  upload.single("coverImage"),
  vendorController.addVendorCover
);
router.post("/setOnline", vendorDetailController.setOnline);
router.post("/setSignupLocation", vendorController.setSignupLocation);
router.post("/showVendorInfo", vendorDetailController.showVendorInfo);
router.post("/showVendorAllDetail", vendorDetailController.showVendorAllDetail);
router.post(
  "/updateVendorCover",
  upload.single("coverImage"),
  vendorController.updateVendorCover
);
router.post(
  "/updateVendorProfileImage",
  upload.single("profileImage"),
  vendorController.updateVendorProfileImage
);
router.post(
  "/showSearchTagsForUpdate",
  vendorController.showSearchTagsForUpdate
);
router.post(
  "/vendorOpenCloseStatus",
  vendorDetailController.vendorOpenCloseStatus
);
router.post(
  "/showVendorSubscription",
  vendorDetailController.showVendorSubscription
);
router.post("/showReceivePayment", vendorController.showReceivePayment);
router.post(
  "/updateVendorSubscription",
  vendorDetailController.updateVendorSubscription
);
router.post(
  "/addVendorPreviousLocation",
  vendorDetailController.addVendorPreviousLocation
);
router.post(
  "/getVendorAllLocation",
  vendorDetailController.getVendorAllLocation
);
router.post("/isTrialExpiry", vendorDetailController.isTrialExpire);
router.post(
  "/showStripeDetailForUpdate",
  vendorDetailController.showStripeDetailForUpdate
);

router.post(
  "/renewVendorSubscription",
  vendorController.renewVendorSubscription
);
router.post(
  "/isSubscriptionExpiry",
  vendorDetailController.isSubscriptionExpire
);
router.post(
  "/vendorSubscriptionDetail",
  vendorController.vendorSubscriptionDetail
);
module.exports = router;
