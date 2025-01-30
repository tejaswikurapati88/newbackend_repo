const express= require('express')
const mysql = require('mysql2/promise');
const cors= require('cors')
require('dotenv').config()
const dbPool = require('./Controllers/dbPool')

const userRouter = require('./Routes/userRoutes')
const plansRouter= require('./Routes/plansRoutes')
const paymentRouter= require('./Routes/paymentRoutes')
const stocksRouter= require('./Routes/stocksRoutes')

const app= express()

app.use(express.json())
app.use(cors())

app.use(express.json());

// Error-handling middleware for JSON parse errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON payload:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});
app.use(cors({
    origin: 'http://localhost:3001',  // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow these HTTP methods
  }));

const PORT = 3000;

const connectAndStartServer= async ()=>{
    try{
        console.log('Connected to the database!');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }catch(err){
        console.log('Error While Connecting:', err)
        process.exit(1)
    }
}

connectAndStartServer()

//Routers

app.use('/users', userRouter)

app.use('/plans', plansRouter)


app.use('/userPayment',paymentRouter)

app.use('/stocks', stocksRouter)


app.get('/api/nifty500/:pagenum/', async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const {pagenum}= req.params
        const offset= (pagenum*10)- 10;
        const niftyQuery=`select * from Nifty500_Company_List Limit 10 offset ${offset} ;`;
        const [nifty500] = await dbPool.query(niftyQuery)
        res.status(200).json(nifty500);
    }catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})