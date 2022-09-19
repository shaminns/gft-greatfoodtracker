const bcrypt = require("bcryptjs");
//Models
const User = require("../Models/User");

async function bcryptPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(enteredPassword, userPassword) {
  return await bcrypt.comparePassword(enteredPassword, userPassword);
}

function escapeLike(string) {
  return string
    .replace("#", "\\#")
    .replace("$", "\\$")
    .replace("%", "\\%")
    .replace("+", "\\+")
    .replace("_", "\\_");
}

function isValueSet(value) {
  return !(value == "" || value == null || value == undefined);
}

function isValueNotSet(value) {
  return value == "" || value == null || value == undefined;
}

function getPageSize() {
  return 10;
}

function getSkipCount(pageNo, pageSize) {
  return (pageNo - 1) * pageSize;
}

function checkPageLowerLimit(pageNo) {
  return pageNo < 1 ? 1 : pageNo;
}

function getPaginationDetails(pageNo) {
  return {
    pageNo: checkPageLowerLimit(pageNo),
    pageSize: getPageSize(),
    skip: getSkipCount(pageNo, getPageSize()),
  };
}

function makePaginationObject(
  pageNo,
  pageSize,
  skip,
  total,
  currentPageRecords
) {
  return {
    currentPage: pageNo,
    pageSize: pageSize,
    from: skip == 0 ? 1 : skip + 1,
    to: currentPageRecords + (pageNo == 1 ? 0 : (pageNo - 1) * pageSize),
    total: total,
  };
}

function getFrontAppUrl() {
  return process.env.MODE == "DEV"
    ? process.env.FRONT_APP_URL_DEV
    : process.env.FRONT_APP_URL_PRO;
}

function getFrontAppResetUrl() {
  return process.env.MODE == "DEV"
    ? process.env.FRONT_APP_RESET_PASSWORD_URL_DEV
    : process.env.FRONT_APP_RESET_PASSWORD_URL_PRO;
}
function getBackAppUrl() {
  return process.env.MODE == "DEV"
    ? process.env.BACK_APP_URL_DEV
    : process.env.BACK_APP_URL_PRO;
}
function makeImagePath(dir, name) {
  return dir + "/" + name;
}
function passwordGenerator() {
  return "AK" + Math.floor(Math.random() * (999999 - 111111) + 111111);
}

function getRandomCode() {
  return Math.floor(Math.random() * (999999 - 111111) + 111111);
}

function getRandomPassword() {
  let length = 8;
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$!&%";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = {
  getFrontAppResetUrl,
  bcryptPassword,
  getPageSize,
  getSkipCount,
  checkPageLowerLimit,
  makePaginationObject,
  getPaginationDetails,
  getFrontAppUrl,
  getBackAppUrl,
  escapeLike,
  makeImagePath,
  isValueSet,
  passwordGenerator,
  comparePassword,
  getRandomCode,
  getRandomPassword,
};
