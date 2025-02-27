const express = require("express");
const { getAllData } = require("../Controllers/searchController");
const router = express.Router();

// //routes
// router.route("/search/:key").get(searchFunction);

// //route to search with related sector or funds of the company
// router
//   .route("/searchWithSuggestion/:key")
//   .get(searchFunctionWithOtherSuggestion);

//route for get all data from company and and mutual fund table
router.get("/allInfo", getAllData);

module.exports = router;
