const express = require("express");

const {getWatchlist, addToWatchlist} = require('../Controllers/watchListController')

const router = express.Router()

router.get('/', getWatchlist)

router.get('/addStockToWatchklist', addToWatchlist)

module.exports = router;