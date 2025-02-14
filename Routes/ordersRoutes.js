const express = require('express')

const {getOrders} = require("../Controllers/ordersController")

const router = express.Router()


router.get('/', getOrders)

module.exports = router