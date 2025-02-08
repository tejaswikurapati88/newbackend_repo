const express= require('express')
const router = express.Router()
const { addUserDetails, getUserDetails, updateUserInvestment }= require("../Controllers/userDetailsController")

// 
router.put('/adduser', addUserDetails)

router.get('/', getUserDetails)

router.put('/adduserinvestment', updateUserInvestment)
module.exports= router
