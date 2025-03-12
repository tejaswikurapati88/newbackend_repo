const dbPool = require("./dbPool");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Function to generate a referral code
const generateReferralCode = (email) => {
  const emailPrefix = email.split("@")[0];
  const randomString = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
  return `${emailPrefix}-${randomString}`;
};

// Function to generate a referral link
const generateReferralLink = (referralCode) => {
  return `https://newbackend-repo.onrender.com/register?referralCode=${referralCode}`;
};

//----------------------------------------------------------------------------------------------------------------------
// Function to send referral email
const sendReferralEmail = async (req, res) => {
  try {
    const {
      referredFirstName,
      referredLastName,
      referredEmail,
      referredMobileNo,
    } = req.body;

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    //getting user_id from token
    const userId = decode.userId;

    // Check if the referred email and movile no already exists]
    const [existingReferrals] = await dbPool.query(
      `SELECT * FROM referrals WHERE referredEmail = ? OR referredMobileNo = ?`,
      [referredEmail, referredMobileNo]
    );

    if (existingReferrals.length > 0) {
      return res
        .status(400)
        .json({ error: "This email and mobile number are already referred!" });
    }

    // Generate a unique referral code for this referral
    const referralCode = generateReferralCode(decode.email);
    const referralLink = generateReferralLink(referralCode);

    // insert referral data into table
    await dbPool.query(
      `INSERT INTO referrals (user_id, referredFirstName, referredLastName, referredEmail, referredMobileNo, ref_code, created_at) 
            VALUES(?,?,?,?,?,?,CONVERT_TZ(NOW(), '+00:00', '+05:30'))`,
      [
        userId,
        referredFirstName,
        referredLastName,
        referredEmail,
        referredMobileNo,
        referralCode,
      ]
    );

    //sending mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: "team@financeshastra.com",
      to: referredEmail,
      subject: "Join Finance Shastra with a Special Invitation!",
      html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>Hi ${referredFirstName},</h2>
                <p>${decode.name} has invited you to join Finance Shastra! Use the link below to sign up and start enjoying exclusive benefits:</p>
                <p style="text-align: center;">
                  <a href="${referralLink}"
                    style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #28a745; text-decoration: none; border-radius: 5px; font-size: 16px;">
                    Sign Up Now
                  </a>
                </p>
                <p>If the button doesn't work, you can also sign up using the following link:</p>
                <p><a href="${referralLink}">${referralLink}</a></p>
                <p>Thanks,<br>Finance Shastra Team</p>
              </div>
            `,
    });

    //Response
    res
      .status(200)
      .json({ success: true, message: "Referral email sent successfully" });
  } catch (error) {
    console.error("Error sending referral email:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

//----------------------------------------------------------------------------------------------------------------------
//Function to get all referrals of the user
const getAllReferrrals = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        error: "Unauthorized: No token provided",
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decode.userId;

    const [referals] = await dbPool.query(
      `SELECT ref_id , referredFirstName , referredLastName ,referredEmail ,referredMobileNo , created_at,subscribe,register,total_earning FROM referrals WHERE user_id = ?`,
      [userId]
    );

    if (referals.length === 0) {
      return res.status(404).json({
        error: "No referrals found!",
      });
    }

    //response
    res.status(200).json({
      success: true,
      message: `Successfully get all referals`,
      referals: referals,
    });
  } catch (error) {
    console.error("Error getting all referrals", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

//----------------------------------------------------------------------------------------------------------------------

module.exports = { sendReferralEmail, getAllReferrrals };
