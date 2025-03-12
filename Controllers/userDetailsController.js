const bcrypt = require('bcrypt');
const dbPool = require('./dbPool');
const jwt = require('jsonwebtoken');

const addUserDetails =  async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const token= req.headers.authorization?.split(" ")[1];
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
            const emaillocal = (decoded.email)
            const useridlocal= decoded.userId
        const {firstName, lastName, dob, gender, email, 
            phoneNumber, country, state, city, occupation, pincode, industry, income, address, ageGroup}= req.body
        if (firstName === ""|| dob=== ""|| gender==="" || email==='' || phoneNumber==="" || country=== ""||
            state === ""|| city==="" || occupation==='' || pincode==="" || industry=== "" || income===''){
                console.log('fill all details')
            return res.status(400).json({message: "All the details should be provided"})
        }else{
            /**const usertablequery= `select * from userstable where email = '${email}'`
            const [usertable] = await dbPool.query(usertablequery)
            const user_idtable= (usertable[0].user_id)*/
            const updateQuery = `
            UPDATE user_details 
            SET first_name = '${firstName}',
            last_name = '${lastName}',
            dob = '${dob}',
            gender = '${gender}',
            phone_number = '${phoneNumber}',
            country = '${country}',
            state = '${state}',
            city = '${city}',
            occupation = '${occupation}',
            pincode= '${pincode}',
            industry = '${industry}',
            address = '${address}',
            age_group = '${ageGroup}',
            income = '${income}',
            user_id= ${useridlocal},
            updated_date= NOW()

            where email = '${emaillocal}';
            `
            await dbPool.query(updateQuery)
            res.status(200).json({ message: 'User details updated successfully' });
        }
    }catch (error){
                console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getUserDetails= async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const token= req.headers.authorization?.split(" ")[1];
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
            const email = (decoded.email)
        console.log(email)
        const getQuery=`SELECT * from user_details where email = '${email}';`
        const [userdetails]= await dbPool.query(getQuery)
        res.status(200).json(userdetails)
    }catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
/*const getUserDetails= async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const email= req.query.email
        const getQuery=`SELECT * from user_details where email = '${email}';`
        const [userdetails]= await dbPool.query(getQuery)
        res.status(200).json(userdetails)
    }catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}*/

const updateUserInvestment=async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
        const userId = (decoded.userId)
        const username = (decoded.email)
        const {householdSavaings,
                termInsurence,
                healthInsurence,
                currentInvestments}= req.body
            const updateQuery = `
                UPDATE user_investment_details 
                SET 
                user_id = ${userId}
                household_savings = '${householdSavaings}',
                term_insurance = '${termInsurence}',
                health_insurance = '${healthInsurence}',
                current_investments = '${currentInvestments}',
                updated_date= NOW()
                where username = ${username};
                `
            await dbPool.query(updateQuery)
            res.status(200).json({ message: 'User investment details updated successfully' });
        
    }catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={addUserDetails, getUserDetails, updateUserInvestment}