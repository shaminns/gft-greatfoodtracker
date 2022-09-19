//Express Router
const express = require("express");
const router = express.Router();

//Controllers
const foodCategories = require("../Controllers/foodCategoriesController");

//Routes
router.post("/addFoodCategories", foodCategories.addFoodCatgories);
router.post("/showFoodCategories", foodCategories.showFoodCatgories);
router.post("/deleteFoodCategories", foodCategories.deleteFoodCatgories);

module.exports = router;
