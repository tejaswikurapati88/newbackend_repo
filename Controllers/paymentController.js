const bcrypt = require('bcrypt');
const dbPool = require('./dbPool');
const jwt = require('jsonwebtoken');


const addUserPayment = async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const {fullName, cardNumber, expirationDate, country, state, 
            city, addressLine1, addressLine2, postalCode, billingCycle, termsAccepted, planId}= req.body
        if (fullName === ""|| cardNumber==="" || expirationDate=== ""|| country=== ""||
            state === ""|| city==="" || addressLine1=== "" || addressLine2==="" || postalCode=== "" || billingCycle===''
            || termsAccepted==="" || planId===""){
                console.log('fill all details')
            return res.status(400).json({message: "All the details should be provided"})
        }else{
            if (termsAccepted === false){
                terms=0
            }else{
                terms=1
            }
            const insertQuery = 'INSERT INTO user_payment_details (full_name, card_number, expiry_date, country, state, city, address_line_1, address_line_2, postal_code, billing_cycle, terms_accepted, plan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
            await dbPool.query(insertQuery, [fullName, cardNumber, expirationDate, 
                country, state, city, addressLine1, addressLine2, postalCode, billingCycle, terms, planId])
            res.status(200).json({ message: 'User payment details added successfully' });
        }
    }catch (error){
                console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const addUserPaymentNew= async(req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const { email, planId, billingCycle, initailDate, paymentMethod, cardNum, cardExpiryDate, upiId}
        = req.body
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
        const user_Id = (decoded.userId)
        if (email === ""|| planId==="" || billingCycle=== ""|| initailDate=== ""||
            paymentMethod === ""){
                console.log('fill all details')
                return res.status(400).json({message: "All the details should be provided"})
        }else{
        const initailDate= new Date();

        const paymentDateTime= `${initailDate.getFullYear()}-${initailDate.getMonth()+1}-${initailDate.getDate()} ${initailDate.getHours()}:${initailDate.getMinutes()}`
        
        const initialDateInsert= `${initailDate.getFullYear()}-${initailDate.getMonth()+1}-${initailDate.getDate()}`
        
        var endDate = new Date(new Date(initailDate).setMonth(initailDate.getMonth() + 6));
        
        const userquery= `Select user_id from userstable where email = '${email}';`
        const [user] = await dbPool.query(userquery)
        const userId= user[0].user_id 
        let order_name
        let Amount
        const status= 'completed'
        if (planId===1){
            order_name=`Elite ${billingCycle}`
            if (billingCycle === "half year"){
                Amount = '1,999'
            }else{
                Amount= '2,999'
            }
        }else if (planId ===2){
            order_name=`Premium ${billingCycle}`
            if (billingCycle === "half year"){
                Amount = '5,999'
            }else{
                Amount= '7,999'
            }
        }
        const orders_date= new Date()
        const formattedDate = `${orders_date.getFullYear()}-${orders_date.getMonth() + 1}-${orders_date.getDate()} ${orders_date.getHours()}:${orders_date.getMinutes()}:${orders_date.getSeconds()}`;
        const ordersQuery = `INSERT INTO orders (order_name, order_date, Amount, Status, user_id) values (?, ?, ?, ?, ?) ;`
        await dbPool.query(ordersQuery, [order_name, formattedDate, Amount, status, user_Id])
        if (paymentMethod==='card'){
            const insertQuery = 'INSERT INTO users_payment_details (user_id, email, plan_id, billing_cycle, payment_date_time, initail_date, ending_date, payment_method, card_num, card_expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
        await dbPool.query(insertQuery, [userId, email, planId, 
            billingCycle, initialDateInsert, paymentDateTime, endDate, paymentMethod, cardNum, cardExpiryDate])
        }else if (paymentMethod==='upi'){
            const insertQuery = 'INSERT INTO users_payment_details (user_id, email, plan_id, billing_cycle, payment_date_time, initail_date, ending_date, payment_method, upi_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);';
        await dbPool.query(insertQuery, [userId, email, planId, 
            billingCycle, initialDateInsert, paymentDateTime, endDate, paymentMethod, upiId])
        }
        
        res.status(200).json({ message: 'User payment details added successfully' });
    }
    }catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteUserPayment = async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const deleteSQL= `Delete from user_payment_details where idElite_payment_premium_form= 3`
        await dbPool.query(deleteSQL)
        res.status(200).json({message: "user details deleted Successfully"})
    }catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getUser= async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({ error: 'Database connection is not established' });
        }
        const selectQuery = 'SELECT * FROM user_payment_details';
        const [users] = await dbPool.query(selectQuery); 
        res.json(users);
    }catch(error){
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports= {
    addUserPayment,
    deleteUserPayment,
    addUserPaymentNew,
    getUser
}