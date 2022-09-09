const fs = require("fs");
//Mongoose
const mongoose = require("mongoose");

// Helpers
const responseHelper = require("../Services/ResponseHelper");
const contactusHelper = require("../Services/ContactusHelper");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");

//********************************************************************************
// Contact Us
//********************************************************************************
exports.sendContactus = async (req, res, next) => {
  let request = req.body;
  let userEmail = request.email;
  let name = request.name;
  let msg = request.message;
  let messageForSend = msg + "\n\nFrom: " + name + " (" + userEmail + ").";
  result = "Email Sent!";

  contactusHelper.sendEmail(userEmail, messageForSend);
  let response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    result
  );
  return res.status(response.code).json(response);
};
