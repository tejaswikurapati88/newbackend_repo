const ExpressBrute = require("express-brute");

const store = new ExpressBrute.MemoryStore(); // Use Redis/MongoDB in production
const sendEmail = require("../email");
const bruteforce = new ExpressBrute(store, {
  freeRetries: 3, // Allow 3 failed attempts
  minWait: 2 * 60 * 1000, // 5-minute lock after max attempts
  failCallback: (req, res, next) => {
    console.log("🚨 Suspicious login detected:", req.body.email);
    const mailOptions = {
      from: process.env.GMAIL,
      to: req.body.email,
      subject: "🚨 Security Alert: Suspicious Login Attempt Detected",
      text: `Dear User,

We have detected multiple unsuccessful login attempts on your account. If this was you, please ensure that you are entering the correct credentials.

If you did not attempt to log in, we strongly recommend resetting your password immediately to secure your account.

To reset your password, please visit: [Your Reset Password Link]

If you need further assistance, please contact our support team.

Best regards,  
Support Team`,
    };
    sendEmail(mailOptions);
    res
      .status(429)
      .json({ message: "Too many failed attempts. Try again later." });
  },
});

module.exports = bruteforce;
