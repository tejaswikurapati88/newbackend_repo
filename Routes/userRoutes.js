const express = require('express')

const {getusers, createUser, userSignin, verifyEmail, resendVerificationEmail, GoogleSignIn, changePass} = require("../Controllers/userController")

const router = express.Router()

// get Users Table 
router.get('/', getusers)
//register user
router.post('/register', createUser)

// Login user
router.post('/signin', userSignin)

//login using signin button

router.post('/auth/google', GoogleSignIn)

router.get('/verifyEmail', verifyEmail)

router.post('/reVerifyMail', resendVerificationEmail)

router.put('/changepass', changePass)


module.exports = router