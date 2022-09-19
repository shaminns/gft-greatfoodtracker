var jwt = require("jsonwebtoken");
const fs = require("fs");
const { getMaxListeners } = require("process");

// Helpers
var UserHelper = require("../Services/UserHelper");
const ResponseHelper = require("../Services/ResponseHelper");

// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");

async function headerCheck(header, res, req) {
  let response = ResponseHelper.getDefaultResponse();
  if (!req.headers.authorization) {
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  if (header) {
    return true;
  }
}

async function tokenCheck(user, res) {
  let response = ResponseHelper.getDefaultResponse();
  if (user == null) {
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (user != null) {
    return true;
  }
}

module.exports = {
  headerCheck,
  tokenCheck,
};
