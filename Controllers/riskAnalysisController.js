const dbPool = require('./dbPool')
const jwt = require('jsonwebtoken')


const addriskAnalysis= async(req, res)=>async (req, res)=>{
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
        const userId = (decoded.userId)
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
            max_pro_loss_prepared,
            willingToRisk_forGoodReturns,
            max_loss_prepared,
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
            const insertQuery = `INSERT INTO risk_analysis (
            user_id,
            age_range,
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
            max_pro_loss_prepared,
            willingToRisk_forGoodReturns,
            max_loss_prepared,
            uncertainty,
            philosophy,
            botheredBy_things,
            risk_taker, answered_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?, NOW());`;
            await dbPool.query(insertQuery, [
                userId,
                age_range,
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
                max_pro_loss_prepared,
                willingToRisk_forGoodReturns,
                max_loss_prepared,
                uncertainty,
                philosophy,
                botheredBy_things,
                risk_taker])
            res.status(200).json({ message: 'User risk analysis added successfully' });
        //}
    }catch (error){
                console.error('Error posting risk analysis:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const updateriskAnalysis= async (req, res)=> {
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'});
        }
        const token= req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
        const userId = (decoded.userId)
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
            max_pro_loss_prepared,
            willingToRisk_forGoodReturns,
            max_loss_prepared,
            uncertainty,
            philosophy,
            botheredBy_things,
            risk_taker}= req.body
        const updateQuery = `
            UPDATE risk_analysis 
            SET 
            age_range= '${age_range}',
            income_range= '${income_range}',
            invest_percentage_range= '${invest_percentage_range}',
            equity_portfolio_size= '${equity_portfolio_size}',
            high_returns_high_risk_investment= '${high_returns_high_risk_investment}',
            major_exp_time_range= '${major_exp_time_range}',
            dependents= '${dependents}',
            stress= '${stress}',
            car_insurence= '${car_insurence}',
            fear= '${fear}',
            risky_investments= '${risky_investments}',
            max_pro_loss_prepared= '${max_pro_loss_prepared}',
            willingToRisk_forGoodReturns= '${willingToRisk_forGoodReturns}',
            max_loss_prepared= '${max_loss_prepared}',
            uncertainty= '${uncertainty}',
            philosophy= '${philosophy}',
            botheredBy_things= '${botheredBy_things}',
            risk_taker = '${risk_taker}', 
            updated_date= NOW()
            Where user_id = ${userId}
        `
        await dbPool.query(updateQuery)
        res.status(200).json({ message: 'User risk analysis updated successfully' });
    }catch(e){
        console.log("Error updating risk analysis:", e);
        res.status(500).json({e: "Internal Server Error"});
    }
}

const getriskAnalysis= async (req, res)=> {
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
        const userId = (decoded.userId)
        const getQuery=`SELECT * from risk_analysis where user_id = ${userId};`
        const [data]= await dbPool.query(getQuery)
        res.status(200).json(data.length)
           
    }catch(e){
        console.log('Error fetching risk analysis:', e);
        res.status(500).json({e: "Internal Server Error"});
    }
}

module.exports={addriskAnalysis, updateriskAnalysis, getriskAnalysis}