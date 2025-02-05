const express= require('express')
const router = express.Router()
const { addUserDetails, getUserDetails }= require("../Controllers/userDetailsController")

// 
router.put('/adduser', addUserDetails)

router.get('/', getUserDetails)
module.exports= router
