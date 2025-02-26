const express = require("express");

const {getWatchlists, addToWatchlist, getAssetFromWatchlist, createWatchlist} = require('../Controllers/watchListController');
const { route } = require("./userRoutes");

const router = express.Router()

router.get('/', getWatchlists)

router.post('/addStockToWatchklist', addToWatchlist)

router.get('/getWatchlistAssets', getAssetFromWatchlist)

router.post('/create', createWatchlist)

module.exports = router;