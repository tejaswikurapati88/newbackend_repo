const express= require('express')
const router = express.Router()
const { getstocks, 
    getcompstocks, 
    getcompstockswithpage, 
    getnifty500comp, 
    getnifty100, 
    getdummycompstocks, 
    getsmallCapCompanies ,
    getmidCapCompanies,
    getlargeCapCompanies
}= require("../Controllers/stocksController")

// get Plans Table 
router.get('/', getstocks)

//get comapny stocks without pagination
router.get('/compstock/', getcompstocks)

// get company stocks with pagenation
router.get('/compstock/:pagenum/', getcompstockswithpage)

// get nifty500
router.get('/nifty500/:pagenum/', getnifty500comp)

// get nifty100 from company_stocks_list
router.get('/nifty100', getnifty100)

//get dummy comp stocks list
router.get('/dummycompstocks', getdummycompstocks)

// get small cap companies stocks 
router.get('/smallcap', getsmallCapCompanies)

// get mid cap companies stocks
router.get('/midcap', getmidCapCompanies)

// get large cap companies stocks
router.get('/largecap', getlargeCapCompanies)

module.exports= router
