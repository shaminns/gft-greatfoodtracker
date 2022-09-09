const moment = require("moment");
const cron = require("node-cron");
const elasticsearch = require("elasticsearch");
// Helpers
const responseHelper = require("../Services/ResponseHelper");
const paracticeHelper = require("../Services/ParacticeHelper");
const orderHelper = require("../Services/OrderHelper");
const userHelper = require("../Services/UserHelper");
const notificationHelper = require("../Services/NotificationHelper");

// Model
const Paractice = require("../Models/Paractice");

// Constants
const Message = require("../Constants/Message.js");
const ResponseCode = require("../Constants/ResponseCode.js");
let Secret_Key = "";

//********************************************************************************
// Set Rating api
//********************************************************************************
exports.setRating = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  await paracticeHelper.setRating(request);
  response = responseHelper.setResponse(
    ResponseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Get Rating api
//********************************************************************************
exports.getRating = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let rating = await paracticeHelper.getRating(request);
  let sum = 0;

  if (rating) {
    for (let i = 0; i < rating.rating.length; i++) {
      if (rating.rating[i].ratingStatus) {
        sum++;
      }
    }
  }

  response = responseHelper.setResponse(
    ResponseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Stripe Working
//********************************************************************************
exports.testStripe = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let stripeToken;

  console.log(Secret_Key);
  const stripe = require("stripe")(Secret_Key);
  await stripe.tokens
    .create({
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: 2022,
        cvc: "314",
      },
    })
    .then((result) => {
      stripeToken = result.id;
    })

    .catch((err) => {
      console.log(err);
      switch (err.type) {
        case "StripeCardError":
          // A declined card error
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message // => e.g. "Your card's expiration year is invalid."
          );
          return res.status(response.code).json(response);
        case "StripeRateLimitError":
          // Too many requests made to the API too quickly
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);

        case "StripeInvalidRequestError":
          // Invalid parameters were supplied to Stripe's API
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        case "StripeAPIError":
          // An error occurred internally with Stripe's API
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        case "StripeConnectionError":
          // Some kind of error occurred during the HTTPS communication
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        case "StripeAuthenticationError":
          // You probably used an incorrect API key
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        default:
          // Handle any other types of unexpected errors
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
      }
    });

  stripe.customers
    .create({
      email: "shami.nns@gmail.com",
      source: stripeToken,
      name: "Gautam Sharma",
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
        amount: 7000, // Charing Rs 25
        description: "Web Development Product",
        currency: "USD",
        customer: customer.id,
      });
    })
    .then((charge) => {
      console.log("wwww", charge);
      res.send("Success"); // If no error occurs
    })
    .catch((err) => {
      res.send(err); // If some error occurs
    });
};
//********************************************************************************
// Stripe Transfer Working
//********************************************************************************
exports.testStripeTransfer = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let stripeToken;

  console.log(Secret_Key);
  const stripe = require("stripe")(Secret_Key);

  const transfer = await stripe.transfers.create({
    amount: 400,
    currency: "usd",
    destination: "acct_1KInizK9xzey95s2",
    description: "test Transfer",
  });

  res.send("Success"); // If no error occurs
};
//********************************************************************************
// Card Testing
//********************************************************************************
exports.cardTest = async (req, res) => {
  let response = responseHelper.getDefaultResponse();
  let stripeToken;
  let aa = "";
  console.log(Secret_Key);
  const stripe = require("stripe")(Secret_Key);
  await stripe.tokens
    .create({
      card: {
        number: "4762150026116593",
        exp_month: 09,
        exp_year: 2022,
        cvc: "029",
      },
    })
    .then((result) => {
      stripeToken = result.id;
    })

    .catch((err) => {
      console.log(err);
      switch (err.type) {
        case "StripeCardError":
          // A declined card error
          console.log("LOOOOOOOOOOOOOOOOGGG", err.message);
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
          break;

        case "StripeRateLimitError":
          // Too many requests made to the API too quickly
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);

        case "StripeInvalidRequestError":
          // Invalid parameters were supplied to Stripe's API
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        case "StripeAPIError":
          // An error occurred internally with Stripe's API
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        case "StripeConnectionError":
          // Some kind of error occurred during the HTTPS communication
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        case "StripeAuthenticationError":
          // You probably used an incorrect API key
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
        default:
          // Handle any other types of unexpected errors
          response = responseHelper.setResponse(
            ResponseCode.NOT_SUCCESS,
            err.message
          );
          return res.status(response.code).json(response);
      }
      // let result = "ok";
      // response = responseHelper.setResponse(ResponseCode.SUCCESS, result);
      // return res.status(response.code).json(response);
    });
  console.log("ok");
  // let result = "ok";
  // response = responseHelper.setResponse(ResponseCode.SUCCESS, result);
  // return res.status(response.code).json(response);
};
//********************************************************************************
// Pending order auto work
//********************************************************************************
exports.testPendingList = async (req, res) => {
  let response = responseHelper.getDefaultResponse();

  let orderList = await orderHelper.pendingOrderList();
  if (orderList != null) {
    for (let i = 0; i < orderList.length; i++) {
      let vendorId = orderList[i].orderTo;
      let vendorDetail = await userHelper.findUserById(vendorId);
      let vendorDeviceToken = vendorDetail.deviceToken;
      let userId = orderList[i].orderBy._id;
      let userDetail = await userHelper.findUserById(userId);
      let userDeviceToken = userDetail.deviceToken;
      let orderId = orderList[i].orderId;
      let orderStatus = process.env.CANCELLED_ORDER;

      let minuteDurration = moment(
        orderList[i].updatedAt,
        "yyyy-MM-dd hh:mm:ss a"
      ).fromNow();

      if (minuteDurration.includes("minute") == true) {
        console.log("minuteDurration : ", minuteDurration);
        if (minuteDurration != "a minute ago") {
          let min = minuteDurration.match(/\d+/)[0];
          console.log("min : ", min);
          //15 min
          if (min >= 2) {
            console.log("order updated!!!!!!!!!!!!!!!!!");
            await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
            //vendor notification
            vendorNotification = {
              title: "order has been Cancelled!",
              body: "Sorry! Order has been Cancelled due to not Accepted or Pending Payment",
            };
            vendorNotificationData = {
              orderStatus: process.env.CANCELLED_ORDER,
              vendorId: vendorId,
              orderId: orderId,
            };

            if (vendorDeviceToken != "") {
              await notificationHelper.sendPushNotification(
                vendorDeviceToken,
                vendorNotification,
                vendorNotificationData
              );
            }
            //user notification
            userNotification = {
              title: "order has been Cancelled!",
              body: "Sorry! Order has been Cancelled due to not Accepted or Pending Payment",
            };
            userNotificationData = {
              orderStatus: process.env.CANCELLED_ORDER,
              vendorId: vendorId,
              orderId: orderId,
            };

            if (userDeviceToken != "") {
              await notificationHelper.sendPushNotification(
                userDeviceToken,
                userNotification,
                userNotificationData
              );
            }
          }

          if (minuteDurration.includes("hour") == true) {
            console.log("order updated h");
            await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
          }
          if (minuteDurration.includes("day") == true) {
            console.log("order updated d");
            await orderHelper.setOrderStatus(orderId, vendorId, orderStatus);
          }
        }
      }
    }
  }
  if (orderList == null) {
    console.log("No pending Order for Delete");
  }
  response = responseHelper.setResponse(ResponseCode.SUCCESS);
  return res.status(response.code).json(response);
};
//********************************************************************************
// Elastic Search work
//********************************************************************************
exports.elasticSearch = async (req, res) => {
  var client = new elasticsearch.Client({
    host: "localhost:4000",
    log: "trace",
    apiVersion: "7.2", // use the same version of your Elasticsearch instance
  });

  ////
  client.ping(
    {
      // ping usually has a 3000ms timeout
      requestTimeout: 1000,
    },
    function (error) {
      if (error) {
        console.trace("elasticsearch cluster is down!");
      } else {
        console.log("All is well");
      }
    }
  );
  /////
  try {
    const response = await client.search({
      q: "pants",
    });
    console.log(response.hits.hits);
  } catch (error) {
    console.trace(error.message);
  }
  ////
  const response = await client.search({
    index: "twitter",
    type: "tweets",
    body: {
      query: {
        match: {
          body: "elasticsearch",
        },
      },
    },
  });

  for (const tweet of response.hits.hits) {
    console.log("tweet:", tweet);
  }
  response = response;
  return res.status(response.code).json(response);
};
