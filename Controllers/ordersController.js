const dbPool= require('./dbPool')
const jwt = require('jsonwebtoken');

const getOrders=async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({ error: 'Database connection is not established' });
        }
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
        const userId = (decoded.userId)
        console.log(userId)
        const selectQuery = `SELECT * FROM orders where user_id = ${userId}`;
        const [orders] = await dbPool.query(selectQuery); 
        res.status(200).json(orders);
    }catch(error){
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={getOrders}