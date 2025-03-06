const express=require("express");
const router=express.Router();
const {sendReferralEmail}=require("../Controllers/userReferralController");

//Route for sending referal link
router.post("/send-referral-email", sendReferralEmail);


module.exports=router;