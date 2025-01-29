const express = require('express')

const {addUserPayment, deleteUserPayment} = require("../Controllers/paymentController")

const router = express.Router()

// user payment 
router.post('/paymentDetails', addUserPayment)

// delete user payment 
router.post('/deleteuserpatment', deleteUserPayment)

module.exports = router