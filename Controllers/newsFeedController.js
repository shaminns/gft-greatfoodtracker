const fs = require("fs");
//Mongoose
const mongoose = require("mongoose");
const moment = require("moment");

// Helpers

const responseHelper = require("../Services/ResponseHelper");
const newsfeedHelper = require("../Services/NewsfeedHelper");
const userHelper = require("../Services/UserHelper");
const vendorDetailHelper = require("../Services/VendorDetailHelper");
const notificationHelper = require("../Services/NotificationHelper");

// Middelwares
const tokenExtractor = require("../Middleware/TokenExtracter");

// Constants
const Message = require("../Constants/Message.js");
const responseCode = require("../Constants/ResponseCode.js");
const { off } = require("process");
//********************************************************************************
// Add Newsfeed
//********************************************************************************
exports.addNewsfeed = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;
  let newsImagePath = [];
  //check image

  if (req.files) {
    req.files.map((item) => {
      return newsImagePath.push(item.path);
    });
  }
  if (!req.headers.authorization) {
    if (req.files) {
      for (let i = 0; i < newsImagePath.length; i++) {
        fs.unlinkSync(newsImagePath[i]);
      }
    }
    response = responseHelper.setResponse(
      responseCode.NOT_FOUND,
      Message.TOKEN_NOT_FOUND
    );
    return res.status(response.code).json(response);
  }
  if (req.headers.authorization) {
    // Get Token
    let token = req.headers.authorization;
    let vendorId = await tokenExtractor.getInfoFromToken(token);
    if (vendorId == null) {
      if (req.files) {
        for (let i = 0; i < newsImagePath.length; i++) {
          fs.unlinkSync(newsImagePath[i]);
        }
      }
      response = responseHelper.setResponse(
        responseCode.NOT_AUTHORIZE,
        Message.INVALID_TOKEN
      );
      return res.status(response.code).json(response);
    }

    if (!request.description) {
      if (req.files) {
        for (let i = 0; i < newsImagePath.length; i++) {
          fs.unlinkSync(newsImagePath[i]);
        }
      }
      let response = responseHelper.setResponse(
        responseCode.NOT_SUCCESS,
        Message.MISSING_PARAMETER
      );
      return res.status(response.code).json(response);
    }

    if (request.description) {
      await newsfeedHelper.addNewsfeed(request, vendorId, newsImagePath);
      let vendorData = await userHelper.findUserById(vendorId);
      let subscriberResultArr =
        await userHelper.findAllUserForNewsFeedNotification(vendorId);
      for (let i = 0; i < subscriberResultArr.length; i++) {
        console.log(subscriberResultArr[i]._id);
        let userId = subscriberResultArr[i]._id;
        let userData = await userHelper.findUserById(userId);
        let vendorName = vendorData.name;
        notification = {
          title:
            "Update from " +
            vendorName.charAt(0).toUpperCase() +
            vendorName.slice(1),
          body:
            vendorName.charAt(0).toUpperCase() +
            vendorName.slice(1) +
            " has posted an update. Check it out!",
        };

        data = {
          message: "newsfeed",
          vendorId: vendorId,
        };
        console.log(userData.deviceToken, notification, data);

        await notificationHelper.sendPushNotification(
          userData.deviceToken,
          notification,
          data
        );
      }
      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL
      );
      return res.status(response.code).json(response);
    }
  }
};
//********************************************************************************
// Show Newsfeed
//********************************************************************************
exports.showNewsfeed = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let vendorId = req.body.vendorId;
  let finalResultArr = [];

  // Get Token
  let token = req.headers.authorization;
  if (token) {
    let vendorIdFromToken = await tokenExtractor.getInfoFromToken(token);
    if (vendorIdFromToken == null) {
      response = responseHelper.setResponse(
        responseCode.NOT_AUTHORIZE,
        Message.INVALID_TOKEN
      );
      return res.status(response.code).json(response);
    }
    if (vendorIdFromToken != null) {
      let newsFeedResult = await newsfeedHelper.getNewsfeed(vendorIdFromToken);
      for (let i = 0; i < newsFeedResult.length; i++) {
        let createdAt = newsFeedResult[i].createdAt;
        let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
          vendorIdFromToken
        );
        let userDetail = await userHelper.findUserById(vendorIdFromToken);
        let profileImage = userDetail.profileImage;
        let coverImage = vendorDetail.coverImage;
        // let chk = moment(createdAt).format("YYYY/MM/DD H:mm");
        // let noww = moment(new Date()).format("YYYY/MM/DD H:mm");
        let timeAgo = moment(createdAt).fromNow();

        // let timeAgo = await this.postTime(noww, chk);

        finalResultArr.push({
          newsResult: newsFeedResult[i],
          profileImage: profileImage,
          coverImage: coverImage,
          postTime: timeAgo,
        });
      }

      response = responseHelper.setResponse(
        responseCode.SUCCESS,
        Message.REQUEST_SUCCESSFUL,
        finalResultArr
      );
      return res.status(response.code).json(response);
    }
  }
  if (!token) {
    let newsFeedResult = await newsfeedHelper.getNewsfeed(vendorId);
    for (let i = 0; i < newsFeedResult.length; i++) {
      let createdAt = newsFeedResult[i].createdAt;
      let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
        vendorId
      );
      let userDetail = await userHelper.findUserById(vendorId);
      let profileImage = userDetail.profileImage;
      let coverImage = vendorDetail.coverImage;
      // let chk = moment(createdAt).format("YYYY/MM/DD H:mm");
      // let noww = moment(new Date()).format("YYYY/MM/DD H:mm");
      let timeAgo = moment(createdAt).fromNow();

      // let timeAgo = await this.postTime(noww, chk);

      finalResultArr.push({
        newsResult: newsFeedResult[i],
        profileImage: profileImage,
        coverImage: coverImage,
        postTime: timeAgo,
      });
    }

    response = responseHelper.setResponse(
      responseCode.SUCCESS,
      Message.REQUEST_SUCCESSFUL,
      finalResultArr
    );
    return res.status(response.code).json(response);
  }
};
//********************************************************************************
// Delete Newsfeed
//********************************************************************************
exports.deleteNewsfeed = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let request = req.body;

  await newsfeedHelper.deleteNewsfeed(request);

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
//********************************************************************************
// Show Newsfeed of Favorite Vendors
//********************************************************************************
exports.favouriteNewsfeed = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();

  let finalResultArr = [];
  // Get Token
  let token = req.headers.authorization;
  let vendorId = await tokenExtractor.getInfoFromToken(token);
  if (vendorId == null) {
    response = responseHelper.setResponse(
      responseCode.NOT_AUTHORIZE,
      Message.INVALID_TOKEN
    );
    return res.status(response.code).json(response);
  }
  let favVendorArr = await userHelper.getFavouriteVendorId(vendorId);
  let favouriteStatus = favVendorArr.favouriteStatus;
  let newsResult = await newsfeedHelper.favouriteNewsfeedSearch(
    favouriteStatus
  );

  for (let i = 0; i < newsResult.length; i++) {
    let vendor = newsResult[i].vendorId;
    let createdAt = newsResult[i].createdAt;
    let vendorDetail = await vendorDetailHelper.findVendorDetailByVendorId(
      vendor
    );
    let userDetail = await userHelper.findUserById(vendor);
    let profileImage = userDetail.profileImage;
    let name = userDetail.name;
    let coverImage = vendorDetail.coverImage;
    let chk = moment(createdAt).format("YYYY/MM/DD H:mm");
    var noww = moment(new Date()).format("YYYY/MM/DD H:mm");
    let timeAgo = await this.postTime(noww, chk);

    finalResultArr.push({
      newsResult: newsResult[i],
      name: name,
      profileImage: profileImage,
      coverImage: coverImage,
      postTime: timeAgo,
    });
  }

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL,
    finalResultArr
  );
  return res.status(response.code).json(response);
};

///////////////////////////////////////////////////////////
//// Add Video ////////////////////////////////////////////
///////////////////////////////////////////////////////////
exports.addVideo = async (req, res, next) => {
  let response = responseHelper.getDefaultResponse();
  let newsFeedId = req.body.newsFeedId;

  //pending due to model class changing
  //in future we will develope
  //hint:
  //Upload video by newsFeed Id

  response = responseHelper.setResponse(
    responseCode.SUCCESS,
    Message.REQUEST_SUCCESSFUL
  );
  return res.status(response.code).json(response);
};
////***********************use with newsFeed controller */

exports.postTime = async (nowDate, createdDate) => {
  let showTime;
  let second = Math.round(
    moment.duration(moment(createdDate).diff(moment(nowDate))).asSeconds()
  );
  let minute = Math.round(
    moment.duration(moment(createdDate).diff(moment(nowDate))).asMinutes()
  );
  let hour = Math.round(
    moment.duration(moment(createdDate).diff(moment(nowDate))).asHours()
  );
  let month = Math.round(
    moment.duration(moment(createdDate).diff(moment(nowDate))).asMonths()
  );
  let year = Math.round(
    moment.duration(moment(createdDate).diff(moment(nowDate))).asYears()
  );

  let mnp = Math.round(month * -1);
  let dp = Math.round((hour * -1) / 24);
  let hp = Math.round((minute * -1) / 60);
  let mp = Math.round((second * -1) / 60);

  let rmp = Math.round(mp);

  if (year > 0) {
    showTime = year;
    if (year == 1) {
      return showTime + " year ago";
    }
    if (year > 1) {
      return showTime + " years ago";
    }
  }
  if (mnp > 0) {
    showTime = mnp;
    if (mnp == 1) {
      return showTime + " month ago";
    }
    if (mnp > 1) {
      return showTime + " month ago";
    }
  }
  if (dp > 0) {
    showTime = dp;
    if (dp == 1) {
      return showTime + " day ago";
    }
    if (dp > 1) {
      return showTime + " days ago";
    }
  }
  if (hp > 0) {
    showTime = hp;
    if (hp == 1) {
      return showTime + " hour ago";
    }
    if (hp > 1) {
      return showTime + " hours ago";
    }
  }
  if (rmp > 0 || rmp < 0) {
    showTime = rmp;
    if (rmp <= 1) {
      return showTime + " min ago";
    }
    if (rmp > 1) {
      return showTime + " mins ago";
    }
  }
};
