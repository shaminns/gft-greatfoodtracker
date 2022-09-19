var jwt = require("jsonwebtoken");
const fs = require("fs");
const { getMaxListeners } = require("process");
const atob = require('atob')
var UserHelper = require("../Services/UserHelper");

async function getIdFromToken(userEmail) {
  let user = await UserHelper.findUserByEmail(userEmail);
  const token = jwt.sign(
    {
      email: user.email,
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "12h",
    }
  );
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
  const tokenParts = token.split(".");
  const encodedToken = tokenParts[1];
  const rawToken = atob(encodedToken);
  const tokenDetails = JSON.parse(rawToken);
  if (!tokenDetails && !tokenDetails.id) {
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_SUCCESS,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }

  return tokenDetails.id;
}

function getInfoFromToken(token) {
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  const tokenParts = token.split(".");
  const encodedToken = tokenParts[1];
  const rawToken = atob(encodedToken);
  const tokenDetails = JSON.parse(rawToken);

  if (!tokenDetails && !tokenDetails.id) {
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_SUCCESS,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  return tokenDetails.id;
}
function getRoleFromToken(token) {
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  const tokenParts = token.split(".");
  const encodedToken = tokenParts[1];
  const rawToken = atob(encodedToken);
  const tokenDetails = JSON.parse(rawToken);

  if (!tokenDetails && !tokenDetails.id) {
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_SUCCESS,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  return tokenDetails.role;
}

function getRoleForUpdateFromToken(token, profileImagePath) {
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  const tokenParts = token.split(".");
  const encodedToken = tokenParts[1];
  const rawToken = atob(encodedToken);
  const tokenDetails = JSON.parse(rawToken);

  if (!tokenDetails && !tokenDetails.id) {
    fs.unlinkSync(profileImagePath);
    response = ResponseHelper.setResponse(
      ResponseCode.NOT_SUCCESS,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  return tokenDetails.role;
}
module.exports = {
  getIdFromToken,
  getInfoFromToken,
  getRoleFromToken,
  getRoleForUpdateFromToken,
};
