const { json } = require('express');
const dbPool = require('./dbPool')
const jwt = require('jsonwebtoken');
require('dotenv').config()

const getPortfolioSummary = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            if (!dbPool) {
                return res.status(500).json({ error: 'Database connection is not established' });
            }
    
            const summaryQuery = `
                SELECT
                    u.user_id,
                    u.name,
                    ROUND(SUM(h.amount), 2) AS investment_cost, 
                    ROUND(SUM((h.buy_quantity * h.buy_price) - h.amount), 2) AS unrealized_gain,
                    ROUND(SUM((h.sell_quantity * h.sell_price) - (h.sell_quantity*h.buy_price)), 2) AS realized_gain,
                    ROUND(SUM(h.buy_quantity * h.buy_price), 2) AS latest_value,
                    ROUND(SUM((h.buy_quantity * h.buy_price) - h.amount)+
                          SUM((h.sell_quantity * h.sell_price) - (h.sell_quantity*h.buy_price)), 2
                    ) AS capital_gains
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
        console.error('Error fetching portfolio summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addStockToPortfolio = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (!dbPool) return res.status(500).json({ error: 'Database connection is not established' });

        const {
            stock_name, type, quantity, price, exchange, date,
            net_amount, total_charges, notes, sip_amount, sip_start_date,
            sip_end_date, frequency, no_of_installments
        } = req.body;
        
        console.log(req.body);

        // Input Validation
        if (!stock_name || !quantity || !price || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
            return res.status(400).json({ error: 'Invalid quantity or price' });
        }

        if (!['Buy', 'Sell'].includes(type)) {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }

        const connection = await dbPool.getConnection();
        try {
            await connection.beginTransaction();

            // Get or Create Portfolio
            const [portfolioRows] = await connection.query(
                `SELECT portfolio_id FROM portfolios WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
                [decoded.userId]
            );

            let portfolio_id = portfolioRows.length ? portfolioRows[0].portfolio_id : null;
            
            if (!portfolio_id) {
                const [newPortfolio] = await connection.query(
                    `INSERT INTO portfolios (user_id, portfolio_name) VALUES (?, ?)`,
                    [decoded.userId, decoded.name]
                );
                portfolio_id = newPortfolio.insertId;
            }

            // Check Existing Holdings
            const [existingStock] = await connection.query(
                `SELECT buy_quantity, buy_price, sell_quantity, sell_price FROM holdings WHERE portfolio_id = ? AND stock_name = ?`,
                [portfolio_id, stock_name]
            );

            if (existingStock.length > 0) {
                let currentBuyQty = parseFloat(existingStock[0].buy_quantity);
                let currentBuyPrice = parseFloat(existingStock[0].buy_price);
                let currentSellQty = parseFloat(existingStock[0].sell_quantity || 0);
                let currentSellPrice = parseFloat(existingStock[0].sell_price || 0);

                if (type === 'Buy') {
                    const totalCost = (currentBuyQty * currentBuyPrice) + (quantity * price);
                    const newBuyQty = parseFloat((Number(currentBuyQty) + Number(quantity)).toFixed(2));
                    const newAvgBuyPrice = parseFloat((totalCost / newBuyQty).toFixed(2));

                    await connection.query(
                        `UPDATE holdings 
                        SET buy_quantity = ?, buy_price = ?, amount = ?, notes = ? 
                        WHERE portfolio_id = ? AND stock_name = ?`,
                        [newBuyQty, newAvgBuyPrice, newBuyQty * newAvgBuyPrice, notes, portfolio_id, stock_name]
                    );

                } else if (type === 'Sell') {
                    if (quantity > currentBuyQty) {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Cannot sell more than available quantity' });
                    }

                    const newBuyQty = parseFloat((currentBuyQty - quantity).toFixed(6));
                    const newSellQty = parseFloat((currentSellQty + quantity).toFixed(6));

                    const totalSellAmount = (currentSellQty * currentSellPrice) + (quantity * price);
                    const newAvgSellPrice = newSellQty > 0 ? parseFloat((totalSellAmount / newSellQty).toFixed(6)) : price;

                    console.log({newBuyQty, newSellQty, totalSellAmount, newAvgSellPrice})
                    if (newBuyQty === 0) {
                        await connection.query(
                            `DELETE FROM holdings WHERE portfolio_id = ? AND stock_name = ?`,
                            [portfolio_id, stock_name]
                        );
                    } else {
                        await connection.query(
                            `UPDATE holdings 
                             SET buy_quantity = ?, sell_quantity = ?, sell_price = ?, amount = ?, notes = ? 
                             WHERE portfolio_id = ? AND stock_name = ?`,
                            [newBuyQty, newSellQty, newAvgSellPrice, newBuyQty * currentBuyPrice, notes, portfolio_id, stock_name]
                        );
                    }
                }
            } else {
                const amount = quantity * price;

                const insertQuery = `
                    INSERT INTO holdings (portfolio_id, type, stock_name, buy_quantity, buy_price, amount, exchange, date, net_amount, total_charges, notes, sell_quantity, sell_price
                    ${sip_amount ? ', sip_amount' : ''} 
                    ${sip_start_date ? ', sip_start_date' : ''} 
                    ${sip_end_date ? ', sip_end_date' : ''} 
                    ${frequency ? ', frequency' : ''} 
                    ${no_of_installments ? ', no_of_installments' : ''}) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? 
                    ${sip_amount ? ', ?' : ''} 
                    ${sip_start_date ? ', ?' : ''} 
                    ${sip_end_date ? ', ?' : ''} 
                    ${frequency ? ', ?' : ''} 
                    ${no_of_installments ? ', ?' : ''});
                `;

                const values = [portfolio_id, type, stock_name, quantity, price, amount, exchange, date, net_amount, total_charges, notes, 0, 0];
                if (sip_amount) values.push(sip_amount);
                if (sip_start_date) values.push(sip_start_date);
                if (sip_end_date) values.push(sip_end_date);
                if (frequency) values.push(frequency);
                if (no_of_installments) values.push(no_of_installments);

                await connection.query(insertQuery, values);
            }

            await connection.commit();
            return res.status(201).json({ message: 'Stock transaction processed successfully' });

        } catch (error) {
            await connection.rollback();
            console.error('Error processing stock transaction:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const allocationChart = async (req, res) => {
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
                    h.type,
                    SUM(h.amount) AS stock_investment
                FROM 
                    userstable u
                JOIN 
                    portfolios p ON u.user_id = p.user_id
                JOIN 
                    holdings h ON p.portfolio_id = h.portfolio_id
                WHERE 
                    u.user_id = ?
                GROUP 
                    BY h.type;

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
    allocationChart
}