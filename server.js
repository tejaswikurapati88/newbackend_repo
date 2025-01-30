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
