require("dotenv").config();

const nodemailer = require("nodemailer");
exports.sendEmail = function sendEmail(email, message) {
  //step1
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  //step2
  let mailOption = {
    from: process.env.EMAIL,
    to: process.env.CONACTUS_EMAIL,
    subject: process.env.CONTACTUS_SUBJECT,
    text: message,
  };

  //step3

  transporter.sendMail(mailOption, function (err, data) {
    if (err) {
      console.log("Error !!!\n\nEmail not sent ");
    } else {
      console.log("Email Sent ");
    }
  });
};
