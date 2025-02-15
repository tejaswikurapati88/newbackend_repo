const express = require('express');
const router = express.Router()

const {getAllData } = require('../Controllers/searchController');

//routes
//router.route("/:key").get(searchFunction);

//route to search with related sector or funds of the company
//router.route("/searchWithSuggestion/:key").get(searchFunctionWithOtherSuggestion);

//route for get all data from company and and mutual fund table
router.route("/allInfo").get(getAllData);

module.exports = router