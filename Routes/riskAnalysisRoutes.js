const express= require('express')
const router= express.Router()
const {addriskAnalysis, updateriskAnalysis, getriskAnalysis}= require('../Controllers/riskAnalysisController')

router.post('/qanda', addriskAnalysis)

router.put('/updaterisk', updateriskAnalysis)

router.get('/', getriskAnalysis)

module.exports= router