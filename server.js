const express= require('express')
const cors= require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const dbPool= require('./Controllers/dbPool')
const jwt = require('jsonwebtoken')
const bcrypt= require('bcrypt')

const userRouter = require('./Routes/userRoutes')
const stockScreenerRouter = require('./Routes/stockScreenerRoute')
const paymentRouter = require('./Routes/paymentRoutes')
const stocksRouter = require('./Routes/stocksRoutes')
const planRouter = require('./Routes/plansRoutes')
const userDetailsRouter= require('./Routes/userDetailsRoutes')
const portfolioRouter = require('./Routes/portfolioRoutes')
const riskAnalysisRouter= require('./Routes/riskAnalysisRoutes')
const ordersRouter = require('./Routes/ordersRoutes')
const iconsRouter = require('./Routes/iconsRoutes')
const mutualFundsRouter = require("./Routes/mutualFundsRoutes");
const searchRouter = require("./Routes/searchRoutes");
const watchlistRouter = require("./Routes/watchListRoutes")
const referralRouter=require("./Routes/userReferralRoutes");
const notificationRouter = require('./Routes/notificationRoutes')
const notificationPermissionRouter = require('./Routes/notificationPermissionRoutes')
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Error-handling middleware for JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Bad JSON payload:", err.message);
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next();
});

const PORT = 3000;

//Routers

app.use("/users", userRouter);

app.use("/referrals",referralRouter);

app.use("/search",searchRouter)

app.use("/userPayment", paymentRouter);

app.use("/stocksScreener", stockScreenerRouter);

app.use("/stocks", stocksRouter);

app.use("/plan", planRouter);

app.use("/search", searchRouter);

app.use("/userdetails", userDetailsRouter);

app.use("/search", searchRouter);

app.use("/myportfolio", portfolioRouter);

app.use('/riskanalysis', riskAnalysisRouter)

app.use('/orders', ordersRouter)

app.use('/icons', iconsRouter)

app.use("/uploads", express.static("uploads"));

app.use("/mutualFunds", mutualFundsRouter);

app.use("/Watchlist", watchlistRouter);

app.use("/notifications",notificationRouter)

app.use("/notificationpermissions",notificationPermissionRouter)


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



connectAndStartServer();
