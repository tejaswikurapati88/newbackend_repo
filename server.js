const express= require('express')
const cors= require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const dbPool= require('./Controllers/dbPool')

const userRouter = require('./Routes/userRoutes')
const stockScreenerRouter = require('./Routes/stockScreenerRoute')
const paymentRouter = require('./Routes/paymentRoutes')
const stocksRouter = require('./Routes/stocksRoutes')
const planRouter = require('./Routes/plansRoutes')
const userDetailsRouter= require('./Routes/userDetailsRoutes')
const portfolioRouter = require('./Routes/portfolioRoutes')

const app = express()

// Middleware
app.use(bodyParser.json());
app.use(express.json())
app.use(cors());

// Error-handling middleware for JSON parse errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON payload:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

const PORT = 3000;

//Routers

app.use('/users', userRouter)

app.use('/userPayment', paymentRouter)

app.use('/stocksScreener', stockScreenerRouter)

app.use('/stocks', stocksRouter)

app.use('/plan', planRouter)

app.use('/userdetails', userDetailsRouter)

app.use('/myportfolio', portfolioRouter)


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

app.post('/qanda', async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const {age_range,
            income_range,
            invest_percentage_range,
            equity_portfolio_size,
            high_returns_high_risk_investment,
            major_exp_time_range,
            dependents,
            stress,
            car_insurence,
            fear,
            risky_investments,
            max_loss_prepared1,
            willingToRisk_forGoodReturns,
            max_loss_prepared2,
            uncertainty,
            philosophy,
            botheredBy_things,
            risk_taker}= req.body
        /*if (fullName === ""|| cardNumber==="" || expirationDate=== ""|| country=== ""||
            state === ""|| city==="" || addressLine1=== "" || addressLine2==="" || postalCode=== "" || billingCycle===''
            || termsAccepted==="" || planId===""){
                console.log('fill all details')
            return res.status(400).json({message: "All the details should be provided"})
        }else{*/
            
            const insertQuery = `INSERT INTO risk_analysis (age_range,
            income_range,
            invest_percentage_range,
            equity_portfolio_size,
            high_returns_high_risk_investment,
            major_exp_time_range,
            dependents,
            stress,
            car_insurence,
            fear,
            risky_investments,
            max_loss_prepared1,
            willingToRisk_forGoodReturns,
            max_loss_prepared2,
            uncertainty,
            philosophy,
            botheredBy_things,
            risk_taker, answered_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?, NOW());`;
            await dbPool.query(insertQuery, [age_range,
                income_range,
                invest_percentage_range,
                equity_portfolio_size,
                high_returns_high_risk_investment,
                major_exp_time_range,
                dependents,
                stress,
                car_insurence,
                fear,
                risky_investments,
                max_loss_prepared1,
                willingToRisk_forGoodReturns,
                max_loss_prepared2,
                uncertainty,
                philosophy,
                botheredBy_things,
                risk_taker])
            res.status(200).json({ message: 'User risk analysis added successfully' });
        //}
    }catch (error){
                console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//Routers

