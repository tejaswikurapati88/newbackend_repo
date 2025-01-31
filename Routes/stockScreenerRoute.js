const express = require('express')

const { sectorAnalyst, stockSector, stockIndex, stockCalender } = require('../Controllers/stockScreenerController')

const router = express.Router()

router.get('/sectorAnalyst', sectorAnalyst)

router.get('/stockSector', stockSector)

router.get('/stockIndex', stockIndex)

router.get('/stockCalender', stockCalender)

module.exports = router