const express = require("express");

const {
  getWatchlist,
  addToWatchlist,
  createNewWatchList,
  renameExistingWatchlist,
  deleteWatchlist,
} = require("../Controllers/watchListController");

const router = express.Router();

router.get("/", getWatchlist);

//route to create new watchList
router.post("/CreateWatchList", createNewWatchList);

//route to rename the existing stock name
router.put("/renameWatchlist", renameExistingWatchlist);

//route to delete watchlist
router.delete("/deleteWatchlist", deleteWatchlist);

router.get("/addStockToWatchklist", addToWatchlist);

module.exports = router;
