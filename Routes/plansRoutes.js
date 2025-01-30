const express= require('express')
const router = express.Router()
const {getplans}= require('../Controllers/plansControllers')

// get Plans Table 
router.get('/', getplans)

module.exports= router