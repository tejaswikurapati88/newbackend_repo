const express = require('express')

const {sectorAnalyst, stockSector} = require('../Controllers/stockScreenerController')

const router = express.Router()

router.get('/sectorAnalyst', sectorAnalyst)

router.get('/stockSector', stockSector)

module.exports = router