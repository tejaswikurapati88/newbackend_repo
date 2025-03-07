const express = require("express");

const {
  getWatchlist,
  addToWatchlist,
  removeStockFromWatchlist,
  createWatchlist,
  renameExistingWatchlist,
  deleteWatchlist,
  getAssetForWatchlist,

  getMutualWatchlists,
  createMutualWatchlist,
  renameMutualWatchlist,
  deleteMutualWatchlist
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

router.delete("/removeStockFromWatchlist", removeStockFromWatchlist);

router.get('/getWatchlistAssets', getAssetForWatchlist)


//Routes for mutuals

router.get("/getMutualWatchlists", getMutualWatchlists);

router.post("/CreateMutualWatchList", createMutualWatchlist);

router.put("/renameMutualWatchlist", renameMutualWatchlist);

router.delete("/deleteMutualWatchlist", deleteMutualWatchlist);

module.exports = router;
