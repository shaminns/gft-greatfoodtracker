//Express Router
const express = require("express");
const router = express.Router();

//Controllers
const contactusController = require("../Controllers/contactusController");

//Routes
router.post("/send", contactusController.sendContactus);

module.exports = router;
