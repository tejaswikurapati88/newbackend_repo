const express = require('express')

const {addUserPayment, deleteUserPayment, addUserPaymentNew, getUser, getUserToken} = require("../Controllers/paymentController")

const router = express.Router()

// user payment 
router.post('/paymentDetails', addUserPayment)

// delete user payment 
router.delete('/deleteuserpatment', deleteUserPayment)

// updated user payment
router.post('/paymentDetails1', addUserPaymentNew)

router.get('/', getUser)

router.get('/usertoken', getUserToken)

module.exports = router