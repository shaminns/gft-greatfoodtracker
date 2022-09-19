//Express Router
const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");

//Controllers
const newsFeedController = require("../Controllers/newsFeedController");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/NewsfeedImages/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

//will be using this for uplading
const upload = multer({ storage: storage });

//upload videos
const videoStorage = multer.diskStorage({
  destination: "Uploads/NewsfeedImages/videos/", // Destination to store video
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 10000000, // 10000000 Bytes = 10 MB
  },
  fileFilter(req, file, cb) {
    // upload only mp4 and mkv format
    if (!file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)) {
      return cb(new Error("Please upload a video"));
    }
    cb(undefined, true);
  },
});

//Routes
router.post(
  "/addNewsfeed",
  upload.array("newsImage", 4),
  newsFeedController.addNewsfeed
);
router.post("/showNewsfeed", newsFeedController.showNewsfeed);
router.post("/deleteNewsfeed", newsFeedController.deleteNewsfeed);
router.post("/showFavouriteNewsfeed", newsFeedController.favouriteNewsfeed);
router.post(
  "/uploadVideo",
  videoUpload.single("video"),
  newsFeedController.addVideo
);

module.exports = router;
