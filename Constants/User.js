const mailFormat = /^[a-zA-Z0-9_\\..-]+@[a-zA-Z0-9-]+(\.[a-z]{2,})+$/;
const passwordFormat = /^(?=.*?[A-Z])(?=.*?[#?!@$%^&*-]).{8,}$/;
const credirCardFormat = /\b\d{16}\b/;
const cvvFormat = /\b\d{3}\b/;
//const creditCardExpiryFormat = /(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2}$)/;  (4digits year)
const creditCardExpiryFormat = /(0[1-9]|1[0-2])\/?([0-9]{2}$)/; //(2 digits year)
const accountFormat = /\b\d{11}\b/;

module.exports = {
  mailFormat: mailFormat,
  passwordFormat: passwordFormat,
  credirCardFormat: credirCardFormat,
  cvvFormat: cvvFormat,
  creditCardExpiryFormat: creditCardExpiryFormat,
  accountFormat: accountFormat,
};
