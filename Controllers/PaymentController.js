// Helpers
const responseHelper = require("../Services/ResponseHelper");

// Model
const Paractice = require("../Models/Paractice");

// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");

//********************************************************************************
// Stripe Payment
//********************************************************************************
exports.stripePayment = async (
  req,
  res,
  stripeKey,
  cardNo,
  cardExpiryMonth,
  cardExpiryYear,
  cardCvc,
  userEmail,
  name,
  orderAmmount,
  orderId,
  vendorId,
  currency,
  userId
) => {
  let sCardNo = cardNo.toString();
  let errMessageStr;
  let response = responseHelper.getDefaultResponse();
  let stripeToken;
  let Secret_Key = stripeKey.toString();
  const stripe = require("stripe")(Secret_Key);
  await stripe.tokens
    .create({
      card: {
        number: sCardNo,
        exp_month: cardExpiryMonth,
        exp_year: cardExpiryYear,
        cvc: "314",
      },
    })
    .then((result) => {
      stripeToken = result.id;
    })

    .catch((err) => {
      switch (err.type) {
        case "StripeCardError":
          // A declined card error
          console.log("1111111111");
          //   response = responseHelper.setResponse(
          //     ResponseCode.NOT_SUCCESS,
          //     err.message // => e.g. "Your card's expiration year is invalid."
          //   );
          //   return res.status(response.code).json(response);
          errMessageStr = err.message;
        //   return errMessageStr;
        case "StripeRateLimitError":
          // Too many requests made to the API too quickly
          //   response = responseHelper.setResponse(
          //     ResponseCode.NOT_SUCCESS,
          //     err.message
          //   );
          //   return res.status(response.code).json(response);
          console.log("2222222222");
          errMessageStr = err.message;
        //   return errMessageStr;
        case "StripeInvalidRequestError":
          // Invalid parameters were supplied to Stripe's API
          //   response = responseHelper.setResponse(
          //     ResponseCode.NOT_SUCCESS,
          //     err.message
          //   );
          //   return res.status(response.code).json(response);
          console.log("3333333333333");
          errMessageStr = err.message;
        //   return errMessageStr;
        case "StripeAPIError":
          // An error occurred internally with Stripe's API
          //   response = responseHelper.setResponse(
          //     ResponseCode.NOT_SUCCESS,
          //     err.message
          //   );
          //   return res.status(response.code).json(response);
          console.log("44444444444444444");
          errMessageStr = err.message;
        //   return errMessageStr;
        case "StripeConnectionError":
          // Some kind of error occurred during the HTTPS communication
          //   response = responseHelper.setResponse(
          //     ResponseCode.NOT_SUCCESS,
          //     err.message
          //   );
          //   return res.status(response.code).json(response);
          console.log("5555555555555555555");
          errMessageStr = err.message;
        //   return errMessageStr;
        case "StripeAuthenticationError":
          // You probably used an incorrect API key
          //   response = responseHelper.setResponse(
          //     ResponseCode.NOT_SUCCESS,
          //     err.message
          //   );
          //   return res.status(response.code).json(response);
          console.log("666666666666666666666");
          errMessageStr = err.message;
        //   return errMessageStr;

        default:
          // Handle any other types of unexpected errors
          errMessageStr = err.message;
      }
      response = responseHelper.setResponse(
        ResponseCode.NOT_SUCCESS,
        err.message
      );
      return res.status(response.code).json(response);
    });
  console.log("Error MessageEEEEEEEEEEEEEEEEEEEE ", errMessageStr);
  stripe.customers
    .create({
      email: userEmail,
      source: stripeToken,
      name: name,
      address: {
        line1: "TC 9/4 Old MES colony",
        postal_code: "110092",
        city: "New Delhi",
        state: "Delhi",
        country: "India",
      },
    })
    .then((customer) => {
      return stripe.charges.create({
        amount: orderAmmount, // Charing Rs 25
        description:
          orderId + " - vendorId : " + vendorId + " - foodieId : " + userId,
        currency: "USD",
        customer: customer.id,
      });
    })
    .then((charge) => {
      console.log("wwww", charge);
      //   res.send("Success"); // If no error occurs
      return charge;
    })
    .catch((err) => {
      //   res.send(err); // If some error occurs
      console.log("EEEEEEEEEEEEEEE", err);
      return err;
    });
};
