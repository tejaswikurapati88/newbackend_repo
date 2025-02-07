const dbPool = require('./dbPool')
const jwt = require('jsonwebtoken');
require('dotenv').config()

const getPortfolioSummary = async (req, res) => {
    try {

        // 1. Verify the JWT from the Authorization header
        const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer header
        console.log(token)
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
            console.log(decoded.userId)
            if (!dbPool) {
                return res.status(500).json({ error: 'Database connection is not established' });
            }
    
            const summaryQuery = `
                SELECT
                    u.user_id,
                    u.name,
                    ROUND(SUM(h.total_investment), 2) AS investment_cost, 
                    ROUND(SUM((h.quantity * h.current_price) - h.total_investment), 2) AS unrealized_gain,
                    ROUND(SUM(h.quantity * h.current_price), 2) AS latest_value
                FROM 
                    userstable u
                JOIN 
                    portfolios p ON u.user_id = p.user_id
                JOIN 
                    holdings h ON p.portfolio_id = h.portfolio_id
                WHERE 
                    u.user_id = ? 
                GROUP BY 
                    u.user_id, u.name;
            `;
    
            const [summaryResult] = await dbPool.query(summaryQuery, [decoded.userId]);
    
            res.status(200).json(summaryResult);
        } catch (error) {
            console.error('Error in fetching portfolio summary:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        
    }
};

const addStockToPortfolio = async (req, res) => {
    try {
        // Extract JWT and verify user authentication
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        if (!dbPool) {
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        const { asset_symbol, asset_type, quantity, average_price, current_price } = req.body;

        if (!asset_symbol || !quantity || !average_price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        //Find the user's portfolio_id
        const portfolioQuery = `SELECT portfolio_id FROM portfolios WHERE user_id = ?`;
        const [portfolioResult] = await dbPool.query(portfolioQuery, [decoded.userId]);

        if (!portfolioResult || portfolioResult.length === 0) {
            const addPortfolio = `INSERT INTO portfolios (user_id, portfolio_name) VALUES (?,?)`
            await dbPool.query(addPortfolio, [decoded.userId, decoded.name])
            return res.status(404).json({ error: 'Portfolio not found' });
        }else{
            const portfolio_id = portfolioResult[0].portfolio_id;
            const total_investment = quantity * average_price;
    
            //Insert stock into holdings
            const insertQuery = `
                INSERT INTO holdings (portfolio_id, asset_type, asset_symbol, quantity, average_price, current_price, total_investment) 
                VALUES (?, ?, ?, ?, ?, ?, ?);
            `;
    
            await dbPool.query(insertQuery, [portfolio_id, asset_type, asset_symbol, quantity, average_price, total_investment, current_price]);
    
            res.status(201).json({ message: 'Stock added successfully' });
        }

    } catch (error) {
        console.error('Error adding stock to portfolio:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAssetDetails = async (req, res) => {
    try {

        // 1. Verify the JWT from the Authorization header
        const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer header
        console.log(token)
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verifying the token
            console.log(decoded.userId)
            if (!dbPool) {
                return res.status(500).json({ error: 'Database connection is not established' });
            }
    
            const assetQuery = `
                SELECT 
                    h.asset_type,
                    SUM(h.total_investment) AS invested_money,
                    ROUND(SUM(h.quantity*h.current_price), 2) AS latest_value
                FROM 
                    userstable u
                JOIN 
                    portfolios p ON u.user_id = p.user_id
                JOIN 
                    holdings h ON p.portfolio_id = h.portfolio_id
                WHERE 
                    u.user_id = ?
                GROUP 
                    BY h.asset_type;

            `;
    
            const [summaryResult] = await dbPool.query(assetQuery, [decoded.userId]);
    
            res.status(200).json(summaryResult);
        } catch (error) {
            console.error('Error in fetching portfolio summary:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        
    }
};




module.exports = {
    getPortfolioSummary,
    addStockToPortfolio,
    getAssetDetails
}