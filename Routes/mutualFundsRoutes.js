const express = require("express");
const {
  getAllFunds,
  smallCapFunds,
  topRatedFunds,
} = require("../Controllers/mutualFundsController");
const router = express.Router();

//Route for get all mutual funds
router.route("/allFunds").get(getAllFunds);

//Route for small cap mutual funds
router.route("/smallCap-Funds").get(smallCapFunds);

//Route for top-rated mutual funds
router.route("/topRated-Funds").get(topRatedFunds);

module.exports = router;
