const express = require('express')
const router =express.Router()
const { getPortfolioSummary, addStockToPortfolio, getAssetDetails } = require('../Controllers/portfolioController')


router.get('/dashboard', getPortfolioSummary )

router.get('/allocationChart', getAssetDetails )

router.post('/addStock', addStockToPortfolio)


module.exports = router