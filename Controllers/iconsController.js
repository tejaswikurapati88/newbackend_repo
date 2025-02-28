const dbPool= require('./dbPool')

const getIcons=async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({ error: 'Database connection is not established' });
        }
        const selectQuery = `SELECT * FROM icons2 where name = '360one.png'`;
        const [icons] = await dbPool.query(selectQuery); 
        res.status(200).json(icons);
    }catch(error){
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={getIcons}