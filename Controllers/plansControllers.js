const dbPool= require('./dbPool')

const getplans=async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({ error: 'Database connection is not established' });
        }
        const selectQuery = 'SELECT * FROM subscription_plan';
        const [plans] = await dbPool.query(selectQuery); 
        res.json(plans);
    }catch(error){
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={getplans}