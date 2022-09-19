// Mongoose
const mongoose = require("mongoose");

// Models
const User = require("../Models/User");

// Helpers
const GeneralHelper = require("./GeneralHelper");

async function foundUserByEmail(email) {
  let result = "";
  await User.findOne({ email: email })
    .populate("organization")
    .exec()
    .then((docs) => {
      result = docs;
    })
    .catch((err) => {
      result = err;
    });

  return result;
}

module.exports = {
  foundUserByEmail,
};
