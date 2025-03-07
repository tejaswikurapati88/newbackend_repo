const express = require("express");
const router = express.Router();
const {
  sendReferralEmail,
  getAllReferrrals,
} = require("../Controllers/userReferralController");

//Route for sending referal link
router.post("/send-referral-email", sendReferralEmail);

//Route for getting referrals
router.get("/get-referrals", getAllReferrrals);

module.exports = router;
