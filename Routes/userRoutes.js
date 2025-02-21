const express = require("express");
const {
  getusers,
  createUser,
  userSignin,
  verifyEmail,
  resendVerificationEmail,
  GoogleSignIn,
  changePass,
  forgetPassword,
  resetPassword,
  deviceInfo,
  endSession,
} = require("../Controllers/userController");

const router = express.Router();

// get Users Table
router.get("/", getusers);
//register user
router.post("/register", createUser);

// Login user
router.post("/signin", userSignin);

//route for getting device information
router.get("/devices", deviceInfo);

//route for end session
router.post("/end-session", endSession);

//login using signin button

router.post("/auth/google", GoogleSignIn);

router.get("/verifyEmail", verifyEmail);

router.post("/reVerifyMail", resendVerificationEmail);

router.put("/changepass", changePass);

//Forgot password routes
router.post("/forget-password", forgetPassword);

router.put("/reset-password/:token", resetPassword);

module.exports = router;
