const express = require("express");

const {
  getWatchlist,
  addToWatchlist,
  createNewWatchList,
  renameExistingWatchlist,
  deleteWatchlist,
} = require("../Controllers/watchListController");

const router = express.Router();

//route for create new watchlist
router.post("/CreateWatchList", createNewWatchList);

//route for rename existing watchlist
router.put("/renameWatchlist", renameExistingWatchlist);

//route for delete watchlist
router.delete("/deleteWatchlist", deleteWatchlist);

router.get("/", getWatchlist);

router.get("/addStockToWatchklist", addToWatchlist);

module.exports = router;
