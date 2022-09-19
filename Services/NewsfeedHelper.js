//Mongoose
const mongoose = require("mongoose");

//Models
const User = require("../Models/User");
const Newsfeed = require("../Models/NewsFeed");

exports.addNewsfeed = async (data, vendorId, newsImagePath) => {
  const newsfeed = new Newsfeed({
    _id: new mongoose.Types.ObjectId(),
    vendorId: vendorId,
    news: {
      description: data.description,
      newsImage: newsImagePath,
    },
  });
  await newsfeed.save();
  return true;
};
exports.getNewsfeed = async (vendorId) => {
  return Newsfeed.find({ vendorId: vendorId })
    .populate("vendorId", "name")
    .sort({
      createdAt: -1,
    });
};

exports.findNewsfeed = async (vendor, title) => {
  return await Newsfeed.find({
    vendorId: vendor,
    "news.title": title,
  }).countDocuments();
};

exports.findNewsfeedId = async (vendor, title) => {
  return await Newsfeed.findOne({ vendorId: vendor, "news.title": title });
};

exports.deleteNewsfeed = async (data) => {
  await Newsfeed.deleteOne({ _id: data._id });
  return true;
};

exports.favouriteNewsfeedSearch = async (arr) => {
  let news = Newsfeed.find(
    { vendorId: { $in: arr } },
    {
      vendorId: 1,
      "news.title": 1,
      "news.description": 1,
      "news.newsImage": 1,
      createdAt: 1,
      _id: 0,
    }
  ).sort({ createdAt: -1 });
  return news;
};
exports.newAddNewsfeed = async (data, vendorId, newsImagePath) => {
  const newsfeed = new NewNewsFeed({
    _id: new mongoose.Types.ObjectId(),
    vendorId: vendorId,
    news: {
      description: data.description,
      newsImage: newsImagePath,
    },
  });
  await newsfeed.save();
  return true;
};
