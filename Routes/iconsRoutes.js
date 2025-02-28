const express = require('express')

const {getIcons} = require("../Controllers/iconsController")

const router = express.Router()


router.get('/', getIcons)

module.exports = router