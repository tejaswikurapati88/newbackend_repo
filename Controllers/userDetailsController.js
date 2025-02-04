const bcrypt = require('bcrypt');
const dbPool = require('./dbPool');

const addUserDetails =  async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const {firstName, lastName, dob, gender, email, 
            phoneNumber, country, state, city, occupation, pincode, industry, income}= req.body
        if (firstName === ""|| dob=== ""|| gender==="" || email==='' || phoneNumber==="" || country=== ""||
            state === ""|| city==="" || occupation==='' || pincode==="" || industry=== "" || income===''){
                console.log('fill all details')
            return res.status(400).json({message: "All the details should be provided"})
        }else{
            const insertQuery = 
'INSERT INTO user_details (first_name, last_name, dob, gender, email, phone_number, country, state, city, occupation, pincode, industry, income) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
            await dbPool.query(insertQuery, [firstName, lastName, dob, gender, email, phoneNumber, 
                country, state, city, occupation, pincode, industry, income])
            res.status(200).json({ message: 'User details added successfully' });
        }
    }catch (error){
                console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={addUserDetails}