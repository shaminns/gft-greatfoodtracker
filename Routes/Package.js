//Express Router
const express = require("express");
const router = express.Router();

//Controllers
const packageController = require("../Controllers/packageController");
//Routes

router.post("/addPackage", packageController.addPackage);
router.post("/updatePackage", packageController.updatePackage);
router.post("/getAllPackage", packageController.getAllPackage);

module.exports = router;
