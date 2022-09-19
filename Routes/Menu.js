//Express Router
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

//Midlewares
const jwtAuth = require("../Middleware/JWTAuth");

//Controllers
const menuController = require("../Controllers/menuController");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/MenuImages/");
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
router.post("/addMenuImage", menuController.addMenuImage);
router.post(
  "/addMenu",
  upload.single("menuTitleImage"),
  menuController.addMenu
);
router.post("/showVendorMenu", menuController.showVendorMenu);
router.post(
  "/updateVendorMenu",
  upload.single("menuTitleImage"),
  menuController.updateVendorMenu
);
router.post(
  "/addPackageTwoImage",
  upload.single("packageImage"),
  menuController.addPackageTwoImage
);
router.post("/deletePackageTwoImage", menuController.deletePackageTwoImage);
router.post("/menuActivationStatus", menuController.menuActivationStatus);
router.post("/deleteMenu", menuController.deleteMenu);
router.post("/showMenuForUpdate", menuController.showMenuForUpdate);
router.post("/showVendorMenuForUser", menuController.showVendorMenuForUser);
router.post("/showAllMenuTitle", menuController.showAllMenuTitle);
router.post("/DeleteMenuByTitle", menuController.DeleteMenuByTitle);
module.exports = router;
