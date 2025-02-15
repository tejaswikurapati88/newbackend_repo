const express = require('express')
const router =express.Router()
const { getPortfolioSummary, addStockToPortfolio, addmutualFundToPortfolio, allocationChart } = require('../Controllers/portfolioController')


router.get('/dashboard', getPortfolioSummary )

router.get('/allocationChart', allocationChart )

router.post('/addStock', addStockToPortfolio)

router.post('/addMutuals', addmutualFundToPortfolio)


module.exports = router