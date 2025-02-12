const express = require('express')
const router =express.Router()
const { getPortfolioSummary, addStockToPortfolio, allocationChart } = require('../Controllers/portfolioController')


router.get('/dashboard', getPortfolioSummary )

router.get('/allocationChart', allocationChart )

router.post('/addStock', addStockToPortfolio)


module.exports = router