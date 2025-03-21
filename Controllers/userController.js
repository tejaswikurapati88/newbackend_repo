const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dbPool = require("./dbPool");
require("dotenv").config();
const bodyParser = require("body-parser");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const getDeviceInfo = require("./deviceTracker");
const userpermissionController = require("./notificationpermissionsController");
// get Users Table
const getusers = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const userId = decoded.userId;

    if (!dbPool)
      return res
        .status(500)
        .json({ error: "Database connection is not established" });

    const selectQuery = "SELECT * from userstable where user_id = ?";
    const [users] = await dbPool.query(selectQuery, [userId]);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------

// Insert user into table
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { referralCode } = req.query;

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
        `select * from userstable where email= ?`,
        [email]
      );

      if (userExists.length === 0) {
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const verificationLink = `${process.env.RENDER_URL}/users/verifyEmail?token=${verificationToken}`;
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const hashedPass = await bcrypt.hash(password, 10);
        const username = email.split("@")[0];
        const datenow = new Date();
        const formattedDate = `${datenow.getFullYear()}-${
          datenow.getMonth() + 1
        }-${datenow.getDate()} ${datenow.getHours()}:${datenow.getMinutes()}:${datenow.getSeconds()}`;

        const insertQuery = `
                    INSERT INTO userstable (name, email, password, verificationToken, tokenExpiry, isVerified, creation_date)
                    VALUES (?, ?, ?, ?, ?, false, ?);
                `;
        const insertintouserDetails = `
                    INSERT INTO user_details (email, username, created_date) Values (?, ?, ?);
                `;
        const insertintouserInvestment = `
                    Insert INTO user_investment_details (username, created_date) Values (?, ?);
                `;
        await dbPool.query(insertintouserInvestment, [username, formattedDate]);
        await dbPool.query(insertintouserDetails, [
          email,
          username,
          formattedDate,
        ]);
        let userResponse = await dbPool.query(insertQuery, [
          name,
          email,
          hashedPass,
          verificationToken,
          tokenExpiry,
          formattedDate,
        ]);
        let permissionPayload = { user_id: userResponse[0].insertId };
        userpermissionController.storeUserNotification(permissionPayload);
        //check if a referral code was used
        if (referralCode) {
          const [updateResult] = await dbPool.query(
            `UPDATE referrals SET register = 1 WHERE ref_code = ?;`,
            [referralCode]
          );
          if (updateResult.affectedRows === 0) {
            return res.status(400).json({ message: "Invalid referral code" });
          }
        }

        // Send the verification email
        const transporter = nodemailer.createTransport({
          service: "Gmail", // Email service
          auth: {
            user: process.env.GMAIL,
            pass: process.env.GMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.GMAIL,
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

//--------------------------------------------------------------------------------------------------------------------

const userSignin = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;
    // Basic validations...
    if (!email)
      return res.status(400).json({ message: "Please enter Email Address" });
    if (!password)
      return res.status(400).json({ message: "Please enter Password" });

    // Query the user
    const isRegUser = `SELECT * FROM userstable WHERE email = ?;`;
    const [user] = await dbPool.query(isRegUser, [email]);

    if (user.length === 0) {
      return res.status(404).json({ message: "Invalid User. Please SignUp!" });
    }
    /*if (user[0].isVerified === 0) {
      return res
        .status(401)
        .json({ message: "Unverified User. Please check your mail!" });
    }*/

    // Verify password
    const compare = await bcrypt.compare(password, user[0].password);
    if (!compare) {
      return res
        .status(400)
        .json({ message: "Incorrect Password. Please try again!" });
    }

    // Use deviceTracker middleware to get device info
    const { userAgent, ipAddress, deviceName } = getDeviceInfo(req);
    const loginTime = new Date();

    // Insert device information into the database
    const insertDeviceQuery = `
      INSERT INTO user_devices (user_id, device_name, ip_address, user_agent,login_time,fcm_token)
      VALUES (?, ?, ?, ?,?,?)
    `;
    await dbPool.query(insertDeviceQuery, [
      user[0].user_id,
      deviceName,
      ipAddress,
      userAgent,
      loginTime,
      fcmToken,
    ]);

    // Fetch the device_id using a query
    const getDeviceQuery = `
      SELECT device_id FROM user_devices 
      WHERE user_id = ? AND device_name = ? AND ip_address = ? AND user_agent = ?
      ORDER BY login_time DESC LIMIT 1
    `;
    const [deviceResult] = await dbPool.query(getDeviceQuery, [
      user[0].user_id,
      deviceName,
      ipAddress,
      userAgent,
    ]);

    if (deviceResult.length === 0) {
      return res.status(500).json({ message: "Error retrieving device ID" });
    }

    const deviceId = deviceResult[0].device_id;

    // Generate JWT token
    const payload = {
      userId: user[0].user_id,
      name: user[0].name,
      email: user[0].email,
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "12h",
    });

    return res
      .status(200)
      .json({ jwtToken: token, deviceId: deviceId, username: user[0].name });
  } catch (error) {
    console.error("Error in /user/signin:", error);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

//--------------------------------------------------------------------------------------------------------------------

//for getting loged device information
const deviceInfo = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token missing or invalid" });
  }

  // extract the actual token
  const token = authHeader.split(" ")[1];

  try {
    //decode the user id from token
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decode.userId;
    const [devices] = await dbPool.query(
      `SELECT device_id, device_name,is_active, ip_address, user_agent, login_time,logout_time FROM user_devices WHERE user_id = ? ORDER BY login_time DESC`,
      [userId]
    );

    //response
    res.status(200).json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching devices" });
  }
};

//--------------------------------------------------------------------------------------------------------------------

const endSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { device_id } = req.body;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token missing or invalid" });
    }

    // extract the actual token
    const token = authHeader.split(" ")[1];

    if (!device_id) {
      return res.status(400).json({ message: "Missing userId or device_id" });
    }

    //decode the user id from token
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decode.userId;

    //checking session is already end or not
    const [existingSession] = await dbPool.query(
      `SELECT is_active FROM user_devices WHERE user_id = ? AND device_id = ?`,
      [userId, device_id]
    );

    if (existingSession.length === 0) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (!existingSession[0].is_active) {
      return res.status(400).json({ message: "Session is already ended" });
    }

    const getISTTime = () => {
      const date = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(date.getTime() + istOffset);
    };

    const logoutTime = getISTTime();

    // Format Date for Display (Indian Standard Time)
    const formatDate = (date) => {
      return date.toLocaleString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const formattedTime = formatDate(logoutTime);

    await dbPool.query(
      `DELETE FROM user_devices WHERE user_id = ? AND device_id = ?`,
      [userId, device_id]
    );

    //response
    return res.status(200).json({
      success: true,
      message: "Session Ended Successfully and Device Removed",
      logoutTime: formattedTime,
      device_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error ending session" });
  }
};

//--------------------------------------------------------------------------------------------------------------------

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

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

    if (new Date(userDetails.tokenExpiry) < Date.now()) {
      await dbPool.query(`DELETE FROM userstable WHERE user_id = ?`, [
        userDetails.user_id,
      ]);

      return res
        .status(410)
        .json({ message: "Verification token expired. User deleted." });
    }

    const updateResult = await dbPool.query(
      `UPDATE userstable 
       SET isVerified = 1, verificationToken = NULL, tokenExpiry = NULL 
       WHERE user_id = ?;`,
      [userDetails.user_id]
    );

    if (updateResult[0].affectedRows > 0) {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    } else {
      return res
        .status(500)
        .json({ message: "User verification failed. Please try again later." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

//--------------------------------------------------------------------------------------------------------------------

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

//--------------------------------------------------------------------------------------------------------------------

// Replace with your Google Client ID
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const GoogleSignIn = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // Verify token using Google's OAuth client
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID, // Ensure this matches your Google Client ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: "Token verification failed" });
    }

    // Extract user details from Google payload
    const { sub: googleUserId, email, name, picture, exp } = payload;

    // Check if the token is expired
    if (Date.now() >= exp * 1000) {
      return res.status(401).json({ error: "Token has expired" });
    }

    // Ensure database connection
    if (!dbPool) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    let userId;
    let userExists = false;

    // Check if user exists in the database
    const findUserQuery =
      "SELECT user_id, name, google_id FROM userstable WHERE email = ?";
    const [existingUser] = await dbPool.query(findUserQuery, [email]);

    if (existingUser.length) {
      userExists = true;
      userId = existingUser[0].user_id;

      // Update only if the name or Google ID has changed
      if (
        existingUser[0].name !== name ||
        existingUser[0].google_id !== googleUserId
      ) {
        const updateUserQuery =
          "UPDATE userstable SET name = ?, google_id = ? WHERE user_id = ?";
        await dbPool.query(updateUserQuery, [name, googleUserId, userId]);
      }
    } else {
      // Start transaction for inserting a new user
      const connection = await dbPool.getConnection();
      try {
        await connection.beginTransaction();

        // Insert new user
        const insertUserQuery =
          "INSERT INTO userstable (email, name, picture, google_id) VALUES (?, ?, ?, ?)";
        const [insertResult] = await connection.query(insertUserQuery, [
          email,
          name,
          picture,
          googleUserId,
        ]);
        userId = insertResult.insertId; // Get the auto-generated ID from the database

        await connection.commit();
        console.log("New user added to the Database", userId);
      } catch (error) {
        await connection.rollback();
        console.error("Error inserting new user:", error);
        return res
          .status(500)
          .json({ error: "Database error: Failed to insert user" });
      } finally {
        connection.release();
      }
    }

    // Generate JWT token using the correct user ID
    const jwtToken = jwt.sign(
      { userId, email, name, picture },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: userExists ? "Login successful" : "Registration successful",
      jwtToken,
      user: { userId, email, name, picture },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

//--------------------------------------------------------------------------------------------------------------------

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

//--------------------------------------------------------------------------------------------------------------------

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
                    password = '${hashednew_pass}'
                    Where user_id= ${userId};
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

//--------------------------------------------------------------------------------------------------------------------

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
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASS,
      },
    });

    const receiver = {
      from: process.env.GMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `Click on this link to generate your new password ${process.env.CLIENT_URL}/forgotresetpassword/${token}`,
      html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2>Hi,</h2>
            <p>You have requested to reset your password. Please click the button below to proceed:</p>
            <p style="text-align: center;">
                <a href="${process.env.CLIENT_URL}/forgotresetpassword/${token}" 
                   style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; font-size: 16px;">
                   Reset Password
                </a>
            </p>
            <p>If the button doesn't work, you can also reset your password by copying and pasting the following link into your browser:</p>
            <p><a href="${process.env.CLIENT_URL}/forgotresetpassword/${token}">${process.env.CLIENT_URL}/forgotresetpassword/${token}</a></p>
            <p>Thanks,<br>Finance Shastra Team</p>
        </div>`,
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

//--------------------------------------------------------------------------------------------------------------------

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
    const updatedAt = new Date();

    //update the user password
    await dbPool.query(
      `UPDATE userstable SET password = ?,passwordUpdatedDate = ? WHERE email = ?`,
      [newHashPassword, updatedAt, decode.email]
    );

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
  deviceInfo,
  endSession,
};
