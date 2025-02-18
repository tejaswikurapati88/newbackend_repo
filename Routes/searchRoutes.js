<<<<<<< HEAD
const express = require("express");
const { getAllData } = require("../Controllers/searchController");
const router = express.Router();


// //routes
// router.route("/search/:key").get(searchFunction);

// //route to search with related sector or funds of the company
// router
//   .route("/searchWithSuggestion/:key")
//   .get(searchFunctionWithOtherSuggestion);
=======
const express = require('express');
const router = express.Router()

const {getAllData } = require('../Controllers/searchController');

//routes
//router.route("/:key").get(searchFunction);

//route to search with related sector or funds of the company
//router.route("/searchWithSuggestion/:key").get(searchFunctionWithOtherSuggestion);
>>>>>>> 4c973eba271efbba0f17af5e29c88b33ba1ea6f0

//route for get all data from company and and mutual fund table
router.route("/allInfo").get(getAllData);

<<<<<<< HEAD

module.exports=router;
=======
module.exports = router
>>>>>>> 4c973eba271efbba0f17af5e29c88b33ba1ea6f0
