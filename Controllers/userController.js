const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dbPool = require("./dbPool");
require("dotenv").config();
const bodyParser = require("body-parser");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

// get Users Table
const getusers = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const selectQuery = "SELECT * from userstable";
    const [users] = await dbPool.query(selectQuery);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Insert user into table
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    if (name === "" || email === "" || password === "") {
      return res
        .status(400)
        .json({ message: "All the details should be provided" });
    } else {
      const [userExists] = await dbPool.query(
        `select * from userstable where email= '${email}'`
      );
      if (userExists.length === 0) {
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const verificationLink = `${process.env.RENDER_URL}/users/verifyEmail?token=${verificationToken}`;
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const hashedPass = await bcrypt.hash(password, 10);
        const username = email.split("@")[0];

        const insertQuery = `
                    INSERT INTO userstable (name, email, password, verificationToken, tokenExpiry, isVerified, creation_date)
                    VALUES (?, ?, ?, ?, ?, false, NOW());
                `;
        const insertintouserDetails = `
                    INSERT INTO user_details (email, username, created_date) Values (?, ?, NOW());
                `;
        const insertintouserInvestment = `
                    Insert INTO user_investment_details (username, created_date) Values (?, NOW());
                `;
        await dbPool.query(insertintouserInvestment, [username]);
        await dbPool.query(insertintouserDetails, [email, username]);
        await dbPool.query(insertQuery, [
          name,
          email,
          hashedPass,
          verificationToken,
          tokenExpiry,
        ]);
        // Send the verification email
        const transporter = nodemailer.createTransport({
          service: "Gmail", // Email service
          auth: {
            user: process.env.GMAIL,
            pass: process.env.GMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: "team@financeshastra.com",
          to: email,
          subject: "Verify Your Email",
          html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                            <h2>Hi ${name},</h2>
                            <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
                            <p style="text-align: center;">
                                <a href="${verificationLink}" 
                                   style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; font-size: 16px;">
                                   Verify Email
                                </a>
                            </p>
                            <p>If the button doesn't work, you can also verify your email by copying and pasting the following link into your browser:</p>
                            <p><a href="${verificationLink}">${verificationLink}</a></p>
                            <p>Thanks,<br>Finance Shastra Team</p>
                        </div>
                    `,
        });
        res.status(200).json({ message: "User registered successfully" });
      } else {
        res.status(400).json({ message: "User already Exists, Please Login!" });
      }
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const userSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    if (email === "") {
      return res.status(400).json({ message: "Please enter Email Address" });
    } else if (password === "") {
      return res.status(400).json({ message: "Please enter Password" });
    } else {
      const isRegUser = `Select * from userstable where email = ?;`;
      const [user] = await dbPool.query(isRegUser, [email]);
      if (user.length === 0) {
        res.status(404).json({ message: "Invalid User. Please SignUp!" });
      } else {
        const compare = await bcrypt.compare(password, user[0].password);
        if (compare) {
          const payload = {
            userId: user[0].user_id,
            name: user[0].name,
            email: user[0].email,
          };

          const token = jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: "1h",
          });
          res.status(200).json({ jwtToken: token });
        } else {
          res
            .status(400)
            .json({ message: "InCorrect Password. Please try again!" });
        }
      }
    }
  } catch (error) {
    console.error("Error in /api/signin:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

    // Check if the token exists
    const [user] = await dbPool.query(
      `SELECT * FROM userstable WHERE verificationToken = ?`,
      [token]
    );

    if (user.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token." });
    }

    const userDetails = user[0];

    // Check token expiry
    if (new Date(userDetails.tokenExpiry) < Date.now()) {
      const query = `
            Delete * from  userstable where user_id = ?;
            `;
      await dbPool.query(query, [userDetails.user_id]);
      res.status(200).json({ message: "unverified user deleted" });
    } else {
      const updateQuery = `
            UPDATE userstable 
            SET isVerified = 1, verificationToken = NULL, tokenExpiry = NULL 
            WHERE user_id = ?;
            `;
      await dbPool.query(updateQuery, [userDetails.user_id]);

      res.status(200).json({ message: "Email verified successfully!" });
    }

    // Update user as verified
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

    // Find the user
    const [user] = await dbPool.query(
      `SELECT * from userstable WHERE email = ?`,
      [email]
    );
    if (user.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    const userDetails = user[0];
    if (userDetails.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate a new token and update the database
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updateQuery = `
            UPDATE userstable
            SET verificationToken = ?, tokenExpiry = ?
            WHERE id = ?;
        `;
    await dbPool.query(updateQuery, [
      verificationToken,
      tokenExpiry,
      userDetails.id,
    ]);

    // Send the verification email
    const verificationLink = `http://localhost:3000/users/verifyEmail?token=${verificationToken}`;
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: "your-email@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                    <h2>Hi ${name},</h2>
                    <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
                    <p style="text-align: center;">
                        <a href="${verificationLink}" 
                           style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; font-size: 16px;">
                           Verify Email
                        </a>
                    </p>
                    <p>If the button doesn't work, you can also verify your email by copying and pasting the following link into your browser:</p>
                    <p><a href="${verificationLink}">${verificationLink}</a></p>
                    <p>Thanks,<br>Finance Shastra Team</p>
                </div>
            `,
    });

    res
      .status(200)
      .json({ message: "Verification email resent successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Replace with your Google Client ID
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const GoogleSignIn = async (req, res) => {
  const { token } = req.body;
  console.log("Received Token:", token);

  try {
    // Decode token to check audience
    const decodedToken = jwt.decode(token);
    console.log("Decoded Token:", decodedToken);

    if (!decodedToken) {
      return res.status(400).json({ error: "Invalid token format" });
    }

    if (decodedToken.aud !== CLIENT_ID) {
      return res.status(403).json({ error: "Token audience mismatch" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Verified Payload:", payload);

    // Extract user details
    const { sub: userId, email, name, picture } = payload;

    // Handling DB logic
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

    const findUserQuery = "SELECT * FROM userstable WHERE email = ?";
    const [existingUser] = await dbPool.query(findUserQuery, [email]);

    if (!existingUser || existingUser.length === 0) {
      const insertUserQuery =
        "INSERT INTO userstable (email, name) VALUES (?, ?)";
      await dbPool.query(insertUserQuery, [email, name]);
      console.log("New user added to the Database");
    } else {
      return res.status(200).json("User already Exists");
    }

    res.status(200).json({
      message: "Authentication successful",
      user: { userId, email, name, picture },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
const deleteUser = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const { userId } = req.params;
    const deleteSQL = `Delete from userstable where user_id= ${userId}`;
    await dbPool.query(deleteSQL);
    res.status(200).json({ message: "user is deleted Successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

const changePass = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
    const userId = decoded.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const getquery = `select password from userstable where user_id= ${userId};`;
    const [userpass] = await dbPool.query(getquery);
    if (userpass.lenght === 0) {
      res.status(405).json({ message: "Invalid User. Please SignUp!" });
    } else {
      const hashedpass = userpass[0].password;
      const compare = await bcrypt.compare(currentPassword, hashedpass);
      if (compare) {
        if (newPassword === confirmPassword) {
          const hashednew_pass = await bcrypt.hash(newPassword, 10);
          const updatequery = `
                    UPDATE userstable 
                    SET 
                    password = '${hashednew_pass}
                    Where user_id= ${userId}';
                    `;
          await dbPool.query(updatequery);
          res.status(200).json({ message: "password updated Successfully!" });
        } else {
          res.status(400).json({
            message: "new password and confirm password should match",
          });
        }
      } else {
        res.status(404).json({
          message: "Please enter correct password!, current password is wrong.",
        });
      }
    }
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// forgot password controller
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    //finding mail
    const [rows] = await dbPool.query(
      "SELECT * FROM userstable WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    //generating token
    const token = jwt.sign({ email }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const receiver = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click on this link to generate your new password ${process.env.CLIENT_URL}/reset-password${token}`,
    };

    await transporter.sendMail(receiver);

    return res.status(200).json({
      success: true,
      message: "Password reset link send successfully on your gmail account",
    });
  } catch (error) {
    console.error("Error sending link:", error);
    res.status(500).json({ message: "Error to send link", error });
  }
};

//for reset password controller
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "please provide password",
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    //finding user
    const [rows] = await dbPool.query(
      `SELECT * FROM userstable WHERE email = ?`,
      [decode.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newHashPassword = await bcrypt.hash(password, 10);

    //update the user password
    await dbPool.query(`UPDATE userstable SET password = ? WHERE email = ?`, [
      newHashPassword,
      decode.email,
    ]);

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error reset password", error });
  }
};

module.exports = {
  getusers,
  createUser,
  userSignin,
  verifyEmail,
  resendVerificationEmail,
  GoogleSignIn,
  deleteUser,
  changePass,
  forgetPassword,
  resetPassword,
};
