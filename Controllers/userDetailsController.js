const bcrypt = require('bcrypt');
const dbPool = require('./dbPool');

const addUserDetails =  async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const {firstName, lastName, dob, gender, email, 
            phoneNumber, country, state, city, occupation, pincode, industry, income, address, ageGroup}= req.body
        if (firstName === ""|| dob=== ""|| gender==="" || email==='' || phoneNumber==="" || country=== ""||
            state === ""|| city==="" || occupation==='' || pincode==="" || industry=== "" || income===''){
                console.log('fill all details')
            return res.status(400).json({message: "All the details should be provided"})
        }else{
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
            income = '${income}'

            where email = '${email}';
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
        const getQuery=`SELECT * from user_details;`
        const [userdetails]= await dbPool.query(getQuery)
        res.status(200).json(userdetails)
    }catch(e){
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={addUserDetails, getUserDetails}