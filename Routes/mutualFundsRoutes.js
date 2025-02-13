const express=require("express");
const { getAllFunds } = require("../Controllers/mutualFundsController");
const router=express.Router();

//Route for get all mutual funds

router.route("/allFunds").get(getAllFunds)

module.exports=router;