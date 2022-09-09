const env = require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");
const { json } = require("body-parser");
const session = require("express-session");
const cookiesParser = require("cookies-parser");
const crypto = require("crypto");

var generate_key = function () {
  return crypto.randomBytes(16).toString("base64");
};

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

// Required Routes
const generalRoutes = require("./Routes/General");
const userRoutes = require("./Routes/User");
const vendorRoutes = require("./Routes/Vendor");
const adminRoutes = require("./Routes/Admin");
const menuRoutes = require("./Routes/Menu");
const packageRoutes = require("./Routes/Package");
const newsfeedRouter = require("./Routes/Newsfeed");
const creditCardRouter = require("./Routes/CreditCard");
const orderRouter = require("./Routes/Order");
const contactusRouter = require("./Routes/Contactus");
const paracticeRoutes = require("./Routes/Paractice");
const foodCategoriesRouter = require("./Routes/FoodCategories");
const cartRouter = require("./Routes/Cart");

const dbUrl = process.env.DB_URL;

// Connect Mongo DB
mongoose.connect(
  dbUrl,
  { useNewUrlParser: true, useCreateIndex: true },
  (err) => {
    if (!err) {
      console.log("Connection Successful");
    } else {
      console.log("Connection not successful", err);
    }
  }
);
mongoose.Promise = global.Promise; // meaning?

// Middlewares
app.use(morgan("dev"));
app.use("/Uploads", express.static("Uploads"));
app.use("/Assets", express.static("Assets"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.set("view engine", "ejs");
app.use(express.static("public"));

// Routes which should handle requests

app.use("/api/", generalRoutes);
app.use("/api/user", userRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/newsfeed", newsfeedRouter);
app.use("/api/creditcard", creditCardRouter);
app.use("/api/order", orderRouter);
app.use("/api/contactus", contactusRouter);
app.use("/api/paractice", paracticeRoutes);
app.use("/api/foodCategories", foodCategoriesRouter);
app.use("/api/cart", cartRouter);

// Default Route When nothing matches
app.use((req, res, next) => {
  const error = new Error("Not found :o :o");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
