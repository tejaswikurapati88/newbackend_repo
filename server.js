const express= require('express')
const cors= require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const dbPool= require('./Controllers/dbPool')
const jwt = require('jsonwebtoken')
const bcrypt= require('bcrypt')
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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

app.use('/riskanalysis', riskAnalysisRouter)

app.use('/orders', ordersRouter)

app.use('/icons', iconsRouter)

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    },
});

const upload = multer({ storage: storage });


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

app.post("/upload", upload.single("image"), async (req, res) => {
  

  try{
    if (!dbPool){
        return res.status(500).json({ error: 'Database connection is not established' });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    

  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
  const email = (decoded.email)
  console.log(email)

  const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

  const sql = `update user_details set profile_image = ? where email = '${email}';`;
  dbPool.query(sql, [imageUrl], (err, result) => {
    if (err) throw err;
    res.json({ message: "Image uploaded successfully", imageUrl });
  });
}catch(error){
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});



connectAndStartServer()


