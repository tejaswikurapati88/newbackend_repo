const express = require('express')

const {addUserPayment, deleteUserPayment, addUserPaymentNew} = require("../Controllers/paymentController")

const router = express.Router()

// user payment 
router.post('/paymentDetails', addUserPayment)

// delete user payment 
router.delete('/deleteuserpatment', deleteUserPayment)

// updated user payment
router.post('/paymentDetails1', addUserPaymentNew)

module.exports = router