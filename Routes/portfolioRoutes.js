const express = require('express')
const router =express.Router()
const { getPortfolioSummary, addStockToPortfolio } = require('../Controllers/portfolioController')


router.get('/dashboard', getPortfolioSummary )

router.post('/addStock', addStockToPortfolio)


module.exports = router