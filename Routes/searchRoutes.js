const express = require("express");
const {
  getAllDataOfStockAndFunds,
  searchFunctionWithOtherSuggestion,
} = require("../Controllers/searchController");
const router = express.Router();

// Route to get all data from company and mutual fund table
router.route("/all-data").get(getAllDataOfStockAndFunds);

//route to search with related sector or funds of the company
router
  .route("/search-with-suggestions/:key")
  .get(searchFunctionWithOtherSuggestion);

module.exports = router;
