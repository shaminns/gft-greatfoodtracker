//Express Router
const express = require("express");
const router = express.Router();

//Controllers
const adminController = require("../Controllers/adminController");
const vendorController = require("../Controllers/vendorController");
const userController = require("../Controllers/userController");
const foodController = require("../Controllers/foodCategoriesController");

//Routes
router.post("/changeRoleToAdmin", adminController.changeRoleToAdmin);
router.post("/saveVendorByAdmin", adminController.saveVendorByAdmin);
router.post("/saveUserByAdmin", adminController.saveUserByAdmin);
router.post("/deleteUser", adminController.deleteUser);
router.post("/unDeleteUser", adminController.unDeleteUser);
router.post("/activatevendor", adminController.activatevendor);
router.post("/findallusers", userController.findAllUsers);
router.post("/searchUserByName", userController.searchUserByName);
router.post("/findallvendors", vendorController.findAllVendors);
router.post("/searchVendorByName", vendorController.searchVendorByName);
router.post("/approveVendorPackage", adminController.approveVendorPackage);
router.post("/activatedVendorsList", adminController.activatedVendorsList);
router.post("/onlineVendorsList", adminController.onlineVendorsList);
router.post(
  "/approvedSubscriptionVendorsList",
  adminController.approvedSubscriptionVendorsList
);
router.post(
  "/pendingSubscriptionVendorsList",
  adminController.pendingSubscriptionVendorsList
);
router.post(
  "/searchPendingSubscriptionVendorsList",
  vendorController.searchPendingSubsVendor
);
router.post("/allUserList", adminController.allUserList);
router.post("/setOnlineForAdmin", adminController.setOnlineForAdmin);

router.post("/findCategoryByName", foodController.findFoodCatgoriesByName);
router.post("/declineVendorList", adminController.declineVendorsList);
router.post(
  "/searchDeclineVendorList",
  vendorController.searchDeclineVendorList
);

module.exports = router;
