const express = require('express')
const router =express.Router()
const { getPortfolioSummary, addStockToPortfolio } = require('../Controllers/portfolioController')


router.get('/dashboard', getPortfolioSummary )



module.exports = router