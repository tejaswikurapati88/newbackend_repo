const express = require('express')
const router =express.Router()
const { getPortfolioSummary, addStockToPortfolio, addmutualFundToPortfolio, allocationChart, portfolioStocks, stocksTransaction, mutualsTransaction } = require('../Controllers/portfolioController')


router.get('/dashboard', getPortfolioSummary )

router.get('/allocationChart', allocationChart )

router.post('/addStock', addStockToPortfolio)

router.post('/addMutuals', addmutualFundToPortfolio)

router.get('/portfoliostocks', portfolioStocks)

router.get('/stocksTransactions', stocksTransaction)

router.get('/mutualTransactions', mutualsTransaction)


module.exports = router