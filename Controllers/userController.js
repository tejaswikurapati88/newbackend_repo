const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dbPool = require('./dbPool');
const jwt= require('jsonwebtoken')
const { use } = require('../Routes/paymentRoutes');
const { error } = require('console');
require('dotenv').config()

// get Users Table 
const getusers = async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({ error: 'Database connection is not established' });
        }
        const selectQuery = 'SELECT * from userstable';
        const [users] = await dbPool.query(selectQuery); 
        res.json(users);
    }catch(error){
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Insert user into table
const createUser =  async (req, res)=>{
    try{
        const { name, email, password}= req.body
        if (!dbPool){
            return res.status(500).json({error: "Database connection is not established" });
        }
        if (name === ""|| email=== "" || password=== ""){
            return res.status(400).json({message: "All the details should be provided"})
        }else{
            const [userExists]= await dbPool.query(`select * from userstable where email= '${email}'`)
            if (userExists.length===0){

                const verificationToken = crypto.randomBytes(32).toString('hex')
                console.log(verificationToken)
                const verificationLink = `http://localhost:3000/users/verifyEmail?token=${verificationToken}`
                const tokenExpiry = new Date(Date.now() + 24*60*60*1000)

                const hashedPass= await bcrypt.hash(password, 10)

                const insertQuery = `
                    INSERT INTO userstable (name, email, password, verificationToken, tokenExpiry, isVerified, creation_date)
                    VALUES (?, ?, ?, ?, ?, false, NOW());
                `;
                const test = await dbPool.query(insertQuery, [name, email, hashedPass, verificationToken, tokenExpiry]);
                
                // Send the verification email
                const transporter = nodemailer.createTransport({
                    service: 'Gmail', // Email service
                    auth: {
                        user: process.env.GMAIL,
                        pass: process.env.GMAIL_PASS,
                    },
                });

                await transporter.sendMail({
                    from: 'your-email@gmail.com',
                    to: email,
                    subject: 'Verify Your Email',
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
                    res.status(200).json({ message: 'User registered successfully' });
            }else{
                res.status(400).json({message: 'User already Exists, Please Login!'})
            }
        }
    }catch(error){
        res.status(500).json({ error: "Internal Server Error", details: error.message})
    }
}

const userSignin = async (req, res)=>{
    try{
        const {email, password}= req.body 
        console.log(req.body)
        if (!dbPool){
            return res.status(500).json({error: "Database connection is not established" })
        }
        if (email ===""){
            return res.status(400).json({ message: "Please enter Email Address"})
        }else if(password=== ''){
            return res.status(400).json({ message: "Please enter Password" })
        }else{
            const isRegUser= `Select * from userstable where email = ?;`
            const [user]= await dbPool.query(isRegUser, [email])
            if (user.length === 0){
                res.status(404).json({message: "Invalid User. Please SignUp!"})
            }else{
                const compare= await bcrypt.compare(password, user[0].password)
                if (compare){
                    const payload = {
                        userId: user.id,
                        name: user.name,
                        email: user.email,
                      };
                    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1h" });
                    res.status(200).json({jwtToken: token})
                }else{
                    res.status(400).json({message: "InCorrect Password. Please try again!"})
                }
                
            }
        }
    }catch(error){
        console.error("Error in /api/signin:", error);
        res.status(500).json({error: "Internal Server Error", details: error.message})
    }
}

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!dbPool) {
            return res.status(500).json({ error: "Database connection is not established" });
        }

        // Check if the token exists
        const [user] = await dbPool.query(
            `SELECT * FROM userstable WHERE verificationToken = ?`, 
            [token]
        );

        if (user.length === 0) {
            return res.status(400).json({ message: "Invalid or expired verification token." });
        }

        const userDetails = user[0];

        // Check token expiry
        if (new Date(userDetails.tokenExpiry) < Date.now()) {
            return res.status(400).json({ message: "Verification token has expired." });
        }

        // Update user as verified
        const updateQuery = `
            UPDATE userstable 
            SET isVerified = 1, verificationToken = NULL, tokenExpiry = NULL 
            WHERE user_id = ?;
        `;
        await dbPool.query(updateQuery, [userDetails.user_id]);

        res.status(200).json({ message: "Email verified successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!dbPool) {
            return res.status(500).json({ error: "Database connection is not established" });
        }

        // Find the user
        const [user] = await dbPool.query(`SELECT * from userstable WHERE email = ?`, [email]);
        if (user.length === 0) {
            return res.status(400).json({ message: "User not found." });
        }

        const userDetails = user[0];
        if (userDetails.isVerified) {
            return res.status(400).json({ message: "Email is already verified." });
        }

        // Generate a new token and update the database
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const updateQuery = `
            UPDATE users
            SET verificationToken = ?, tokenExpiry = ?
            WHERE id = ?;
        `;
        await dbPool.query(updateQuery, [verificationToken, tokenExpiry, userDetails.id]);

        // Send the verification email
        const verificationLink = `http://localhost:3000/users/verifyEmail?token=${verificationToken}`;
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.GMAIL,
                pass: process.env.GMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Verify Your Email',
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

        res.status(200).json({ message: "Verification email resent successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

const deleteUser= async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const {userId}= req.params
        const deleteSQL= `Delete from userstable where user_id= ${userId}`
        await dbPool.query(deleteSQL)
        res.status(200).json({message: "user is deleted Successfully"})
    }catch (error){
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}


module.exports = {
    getusers,
    createUser,
    userSignin,
    verifyEmail,
    resendVerificationEmail,
    deleteUser
}