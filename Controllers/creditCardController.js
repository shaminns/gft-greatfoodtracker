const moment = require("moment");
const stripe = require("stripe");
// Helpers
const responseHelper = require("../Services/ResponseHelper");
const userHelper = require("../Services/UserHelper");
const credentialHelper = require("../Services/CredentialHelper");
const creditCardHelper = require("../Services/CreditCardHelper");
const packageHelper = require("../Services/PackageHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");

// Model
const User = require("../Models/User");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");
const Role = require("../Constants/Role.js");
const { ConnectionStates } = require("mongoose");

//********************************************************************************
// Collect/Save Credit Card Data api
//********************************************************************************
exports.addCreditCard = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let cardType;
  // let ammount = request.ammount;
  let userEmail = request.email;
  let packageId = request.packageId;

  let user = await userHelper.findUserByEmail(userEmail);
  if (user == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.USER_NOT_EXIST
    );
    response.data = request;
    return res.status(response.code).json(response);
  }

  let userId = user._id;

  let name = request.name;
  let cardNo = request.cardNo;
  let expiryDate = request.expiryDate;
  let cvvCode = request.cvvCode;

  let stripePublicKey = request.stripePublicKey;
  let stripeSecretKey = request.stripeSecretKey;

  let trailExpiry = moment().add(14, "days").format("YYYY-MM-DD");

  let saveCard = request.saveCard;

  if (!(name && cardNo && expiryDate && cvvCode)) {
    response = responseHelper.setResponse(
      responseCode.NOT_SUCCESS,
      Message.MISSING_PARAMETER
    );
    return res.status(response.code).json(response);
  }
  if (cardNo && expiryDate && cvvCode) {
    let cardExpiry = expiryDate.split("/");

    let currentMomentMonth = new moment().format("MM");
    let currentMonth = parseInt(currentMomentMonth);

    let currentMomentYear = moment().format("YY");
    let currentYear = parseInt(currentMomentYear);

    if (parseInt(cardExpiry[1]) < currentYear) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.CARD_EXPIRE
      );
      return res.status(response.code).json(response);
    }
    if (parseInt(cardExpiry[1]) >= currentYear) {
      if (parseInt(cardExpiry[0]) < currentMonth) {
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.CARD_EXPIRE
        );
        return res.status(response.code).json(response);
      }
      if (parseInt(cardExpiry[0]) >= currentMonth) {
        cardExp = expiryDate;
      }
    }
    // Validate Card Pattern
    let cardNoResult = credentialHelper.creditCardCheck(cardNo);
    let cvvResult = credentialHelper.cvvCheck(cvvCode);
    let cardExpiryResult = credentialHelper.creditCardExpiryCheck(expiryDate);

    if (cardNoResult == false) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_CARD_NUMBER
      );
      return res.status(response.code).json(response);
    }
    if (cvvResult == false) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_CVV_CODE
      );
      return res.status(response.code).json(response);
    }
    if (cardExpiryResult == false) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.INVALID_EXPIRY_DATE
      );
      return res.status(response.code).json(response);
    }
    let cardResult = await creditCardHelper.findCardByEmail(userEmail, cardNo);

    if (cardResult != null && saveCard == true) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.ALREADY_EXIST
      );
      return res.status(response.code).json(response);
    }
    if (cardResult != null && saveCard == false) {
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        (response.data = request)
      );
      return res.status(response.code).json(response);
    }
    if (cardResult == null) {
      // if (saveCard == true) {
      let cardFirstDigit;
      if (cardResult == null) {
        for (let i = 0; i < 1; i++) {
          cardFirstDigit = cardNo[i];
        }

        if (cardFirstDigit == 3) {
          cardType = process.env.AMERICAN_EXPRESS;
        }
        if (cardFirstDigit == 4) {
          cardType = process.env.VISA;
        }
        if (cardFirstDigit == 5) {
          cardType = process.env.MASTER_CARD;
        }
        if (cardFirstDigit == 6) {
          cardType = process.env.DISCOVER;
        }
      }
      await creditCardHelper.addCreditCard(
        userId,
        userEmail,
        name,
        cardNo,
        expiryDate,
        cvvCode,
        cardType
      );
      // }
      await userHelper.addStripeDetail(
        userEmail,
        stripePublicKey,
        stripeSecretKey
      );
      await vendorDetailHelper.addTrialExpiryDate(userId, trailExpiry);
      let result = {
        Card_No: cardNo,
        Expiry_Date: expiryDate,
        CVV_Code: cvvCode,
        Card_Type: cardType,
      };
      let packageDetail = await packageHelper.findPackage(packageId);
      let packageDbId = packageDetail._id;
      let packagePrice = packageDetail.price;

      await vendorDetailHelper.updateVendorPackage(userId, packageDbId);

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        result
      );
      response.Price = packagePrice;
      return res.status(response.code).json(response);
    }
  }
};

//********************************************************************************
// Add Credit Card for User api
//********************************************************************************
exports.addCardForUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let cardExp;

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;

  let userId = await tokenExtractor.getInfoFromToken(token);
  let userDetail = await userHelper.findUserById(userId);
  let userEmail = userDetail.email;
  let userName = userDetail.name;

  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let cardNo = request.cardNo;
    let expiryDate = request.expiryDate;
    let cvvCode = request.cvvCode;

    let saveCard = request.saveCard;

    if (!(cardNo && expiryDate && cvvCode)) {
      response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.MISSING_PARAMETER
      );
      return res.status(response.code).json(response);
    }
    if (cardNo && expiryDate && cvvCode) {
      let cardExpiry = expiryDate.split("/");

      let today = new Date();
      let currentMonth = today.getMonth();
      let currentYear = today.getFullYear().toString().substr(2, 2);

      if (cardExpiry[1] < currentYear) {
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.CARD_EXPIRE
        );
        return res.status(response.code).json(response);
      }
      if (cardExpiry[1] >= currentYear) {
        if (cardExpiry[0] < currentMonth) {
          response = responseHelper.setResponse(
            responseCode.NOT_SUCCESS,
            Message.CARD_EXPIRE
          );
          return res.status(response.code).json(response);
        }
        if (cardExpiry[0] >= currentMonth) {
          cardExp = request.expiryDate;
        }
      }
      // Validate Card Pattern
      let cardNoResult = credentialHelper.creditCardCheck(cardNo);
      let cvvResult = credentialHelper.cvvCheck(cvvCode);
      let cardExpiryResult = credentialHelper.creditCardExpiryCheck(expiryDate);

      if (cardNoResult == false) {
        response = responseHelper.setResponse(
          rssponseCode.NOT_SUCCESS,
          Message.INVALID_CARD_NUMBER
        );
        return res.status(response.code).json(response);
      }
      if (cvvResult == false) {
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.INVALID_CVV_CODE
        );
        return res.status(response.code).json(response);
      }
      if (cardExpiryResult == false) {
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.INVALID_EXPIRY_DATE
        );
        return res.status(response.code).json(response);
      }
      let cardResult = await creditCardHelper.findCardByEmail(
        userEmail,
        cardNo
      );

      if (cardResult != null) {
        response = responseHelper.setResponse(
          responseCode.NOT_SUCCESS,
          Message.ALREADY_EXIST
        );
        return res.status(response.code).json(response);
      }

      let cardType;
      let cardFirstDigit;
      if (cardResult == null) {
        for (let i = 0; i < 1; i++) {
          cardFirstDigit = cardNo[i];
        }

        if (cardFirstDigit == 3) {
          cardType = process.env.AMERICAN_EXPRESS;
        }
        if (cardFirstDigit == 4) {
          cardType = process.env.VISA;
        }
        if (cardFirstDigit == 5) {
          cardType = process.env.MASTER_CARD;
        }
        if (cardFirstDigit == 6) {
          cardType = process.env.DISCOVER;
        }

        await creditCardHelper.addCreditCardForUser(
          userId,
          userEmail,
          userName,
          cardNo,
          expiryDate,
          cvvCode,
          cardType
        );

        let result = {
          Card_No: cardNo,
          Expiry_Date: expiryDate,
          CVV_Code: cvvCode,
          Card_Type: cardType,
        };

        response = responseHelper.setResponse(
          responseCode.SUCCESS,
          Message.REQUEST_SUCCESSFUL,
          result
        );
        return res.status(response.code).json(response);
      }
    }
  }
};
//********************************************************************************
// Show User/Vendor All Cards api
//********************************************************************************
exports.showAllCardsForUser = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;

  let userId = await tokenExtractor.getInfoFromToken(token);

  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let result = await creditCardHelper.showUserCreditCards(userId);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Delete User/Vendor Credit Card
//********************************************************************************
exports.deleteUserVendorCreditCard = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;

  let userId = await tokenExtractor.getInfoFromToken(token);

  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    await creditCardHelper.deleteCreditCard(userId, request.cardNo);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Show Credit Card Detail api
//********************************************************************************
exports.showCreditCard = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  if (!req.headers.authorization) {
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  //Get Token
  let token = req.headers.authorization;

  let userId = await tokenExtractor.getInfoFromToken(token);

  if (userId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  if (userId != null) {
    let result = await creditCardHelper.showCardDetail(userId, request.cardNo);
    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      result
    );
    return res.status(response.code).json(response);
  }
};
