const express = require('express')

const {getusers, createUser, userSignin, verifyEmail, resendVerificationEmail, deleteUser} = require("../Controllers/userController")

const router = express.Router()

// get Users Table 
router.get('/', getusers)
//register user
router.post('/register', createUser)

// Login user
router.post('/signin', userSignin)

router.get('/verifyEmail', verifyEmail)

router.post('/reVerifyMail', resendVerificationEmail)

router.delete('/deleteuser/:userId', deleteUser)


module.exports = router