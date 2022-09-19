const userConst = require("../Constants/User.js");

exports.emailCheck = function emailCheck(emailAddress) {
  if (!emailAddress.match(userConst.mailFormat)) {
    return false;
  } else {
    return true;
  }
};
exports.passwordCheck = function passwordCheck(passwordCheck) {
  if (!passwordCheck.match(userConst.passwordFormat)) {
    return false;
  } else {
    return true;
  }
};
exports.creditCardCheck = function creditCardCheck(creditCardNo) {
  if (!creditCardNo.match(userConst.credirCardFormat)) {
    return false;
  } else {
    return true;
  }
};
exports.creditCardExpiryCheck = function creditCardExpiryCheck(expiryDate) {
  if (!expiryDate.match(userConst.creditCardExpiryFormat)) {
    return false;
  } else {
    return true;
  }
};
exports.cvvCheck = function cvvCheck(cvvCode) {
  if (!cvvCode.match(userConst.cvvFormat)) {
    return false;
  } else {
    return true;
  }
};
exports.accountNumberCheck = function accountNumberCheck(accountNumber) {
  if (!accountNumber.match(userConst.accountFormat)) {
    return false;
  } else {
    return true;
  }
};
