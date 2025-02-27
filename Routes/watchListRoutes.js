const express = require("express");

const {
  getWatchlist,
  addToWatchlist,
  createWatchlist,
  renameExistingWatchlist,
  deleteWatchlist,
  getAssetForWatchlist
} = require("../Controllers/watchListController");

const router = express.Router();

//route for create new watchlist
router.post("/CreateWatchList", createWatchlist);

//route for rename existing watchlist
router.put("/renameWatchlist", renameExistingWatchlist);

//route for delete watchlist
router.delete("/deleteWatchlist", deleteWatchlist);

router.get("/", getWatchlist);

router.post("/addStockToWatchklist", addToWatchlist);

router.get('/getWatchlistAssets', getAssetForWatchlist)

module.exports = router;
