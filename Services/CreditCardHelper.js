const moment = require("moment");
const fs = require("fs");

//Mongoose
const mongoose = require("mongoose");

//Models
const User = require("../Models/User");
const CreditCard = require("../Models/CreditCard");

//Constant
const Role = require("../Constants/Role");

exports.findCardByEmail = async (userEmail, cardNo) => {
  return await CreditCard.findOne({ userEmail: userEmail, cardNo: cardNo });
};
exports.findCardByUserId = async (userId, cardNo) => {
  return await CreditCard.findOne({ userId: userId, cardNo: cardNo });
};
exports.addCreditCard = async (
  userId,
  userEmail,
  name,
  creditCardNo,
  creditCardExpiry,
  creditCardCvv,
  cardType
) => {
  const creditCard = new CreditCard({
    _id: new mongoose.Types.ObjectId(),
    userId: userId,
    userEmail: userEmail,
    name: name,
    cardNo: creditCardNo,
    expiryDate: creditCardExpiry,
    cvvCode: creditCardCvv,
    cardType: cardType,
  });

  await creditCard.save();
  return true;
};
exports.addCreditCardForUser = async (
  userId,
  userEmail,
  userName,
  creditCardNo,
  creditCardExpiry,
  creditCardCvv,
  cardType
) => {
  const creditCard = new CreditCard({
    _id: new mongoose.Types.ObjectId(),
    userId: userId,
    userEmail: userEmail,
    name: userName,
    cardNo: creditCardNo,
    expiryDate: creditCardExpiry,
    cvvCode: creditCardCvv,
    cardType: cardType,
  });

  await creditCard.save();
  return true;
};
exports.showUserCreditCards = async (userId) => {
  return await CreditCard.find(
    { userId: userId },
    { name: 1, cardType: 1, cardNo: 1 }
  );
};
exports.deleteCreditCard = async (userId, cardNo) => {
  return await CreditCard.deleteOne({ userId: userId, cardNo: cardNo });
};
exports.showCardDetail = async (userId, cardNo) => {
  return await CreditCard.findOne({ userId: userId, cardNo: cardNo });
};
exports.findCardByUserIdAndCardNo = async (userId, cardNo) => {
  return await CreditCard.findOne({ userId: userId, cardNo: cardNo });
};
exports.updateCreditCardByUserIdAndCardNo = async (userId, data) => {
  let card = await CreditCard.findOne({ userId: userId });
  card.cardNo = data.cardNo || card.cardNo;
  card.expiryDate = data.expiryDate || card.expiryDate;
  card.cvvCode = data.cvvCode || card.cvvCode;

  let cardModel = new CreditCard(card);
  return cardModel.save().then((fullfilled) => {
    return fullfilled;
  });
};
