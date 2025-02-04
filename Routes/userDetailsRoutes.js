const express= require('express')
const router = express.Router()
const { addUserDetails }= require("../Controllers/userDetailsController")

// get Plans Table 
router.post('/adduser', addUserDetails)

module.exports= router
