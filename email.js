const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL, // Moved to .env
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Send an email with dynamic mail options
 * @param {Object} mailOptions - Contains `to`, `subject`, and `text/html`
 */
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

module.exports = sendEmail;
