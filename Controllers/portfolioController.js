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






module.exports = {
    getPortfolioSummary
}