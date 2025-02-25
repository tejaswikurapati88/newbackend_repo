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
                    
                    -- Investment Cost (Stocks + Mutual Funds)
                    ROUND(SUM(h.amount) + SUM(mh.amount), 2) AS investment_cost, 
                    
                    -- Unrealized Gain (Stocks + Mutual Funds)
                    ROUND(SUM((h.buy_quantity * h.buy_price) - h.amount) + 
                        SUM((mh.buy_quantity * mh.buy_price) - mh.amount), 2) AS unrealized_gain,
                    
                    -- Realized Gain (Stocks + Mutual Funds)
                    ROUND(SUM((h.sell_quantity * h.sell_price) - (h.sell_quantity * h.buy_price)) + 
                        SUM((mh.sell_quantity * mh.sell_price) - (mh.sell_quantity * mh.buy_price)), 2) AS realized_gain,
                    
                    -- Latest Value (Stocks + Mutual Funds)
                    ROUND(SUM(h.buy_quantity * h.buy_price) + 
                        SUM(mh.buy_quantity * mh.buy_price), 2) AS latest_value,
                    
                    -- Capital Gains (Stocks + Mutual Funds)
                    ROUND(
                        (SUM((h.buy_quantity * h.buy_price) - h.amount) + 
                        SUM((mh.buy_quantity * mh.buy_price) - mh.amount)) + 
                        (SUM((h.sell_quantity * h.sell_price) - (h.sell_quantity * h.buy_price)) + 
                        SUM((mh.sell_quantity * mh.sell_price) - (mh.sell_quantity * mh.buy_price))), 2
                    ) AS capital_gains

                FROM userstable u
                JOIN portfolios p ON u.user_id = p.user_id
                LEFT JOIN holdings h ON p.portfolio_id = h.portfolio_id
                LEFT JOIN mutualfund_holdings mh ON p.portfolio_id = mh.portfolio_id

                WHERE u.user_id = ? 

                GROUP BY u.user_id, u.name;

            `;
    
            const [summaryResult] = await dbPool.query(summaryQuery, [decoded.userId]);
            console.log(summaryResult)
    
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
                let existingBuyQty = parseFloat(existingStock[0].buy_quantity);
                let existingBuyPrice = parseFloat(existingStock[0].buy_price);
                let existingSellQty = parseFloat(existingStock[0].sell_quantity || 0);
                let existingSellPrice = parseFloat(existingStock[0].sell_price || 0);

                if (type === 'Buy') {
                    const totalCost = (existingBuyQty * existingBuyPrice) + (quantity * price);
                    const newBuyQty = parseFloat((Number(existingBuyQty) + Number(quantity)).toFixed(2));
                    const newAvgBuyPrice = parseFloat((totalCost / newBuyQty).toFixed(2));

                    await connection.query(
                        `UPDATE holdings 
                        SET buy_quantity = ?, buy_price = ?, amount = ?, notes = ? 
                        WHERE portfolio_id = ? AND stock_name = ?`,
                        [newBuyQty, newAvgBuyPrice, newBuyQty * newAvgBuyPrice, notes, portfolio_id, stock_name]
                    );

                } else if (type === 'Sell') {
                    if (quantity > existingBuyQty) {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Cannot sell more than available quantity' });
                    }

                    const newBuyQty = parseFloat((existingBuyQty - quantity).toFixed(6));
                    const newSellQty = parseFloat((existingSellQty + quantity).toFixed(6));
                    const totalSellAmount = (existingSellQty * existingSellPrice) + (quantity * price);
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
                            [newBuyQty, newSellQty, newAvgSellPrice, newBuyQty * existingBuyPrice, notes, portfolio_id, stock_name]
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

const addmutualFundToPortfolio = async (req, res) => {
    try {
        // Extract and verify JWT token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
            console.log(decoded)
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (!dbPool) return res.status(500).json({ error: 'Database connection is not established' });

        const { type, scheme, nav_date, nav, amount, quantity, dividend = null, notes = null, sip_amount, sip_start_date,
            sip_end_date, frequency, no_of_installments } = req.body;

        // Validate input
        if (!scheme || !quantity || !nav || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (isNaN(quantity) || quantity <= 0 || isNaN(nav) || nav <= 0) {
            return res.status(400).json({ error: 'Invalid quantity or NAV' });
        }

        if (!['Buy', 'Sell'].includes(type)) {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }

        const connection = await dbPool.getConnection();
        try {
            await connection.beginTransaction();

            // Get or create the user's portfolio
            const [portfolioRows] = await connection.query(
                `SELECT portfolio_id FROM portfolios WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
                [decoded.userId]
            );
            console.log(portfolioRows)
            console.log(portfolioRows[0])

            let portfolio_id = portfolioRows.length ? portfolioRows[0].portfolio_id : null;

            if (!portfolio_id) {
                const [newPortfolio] = await connection.query(
                    `INSERT INTO portfolios (user_id, portfolio_name) VALUES (?, ?)`,
                    [decoded.userId, decoded.name]
                );
                portfolio_id = newPortfolio.insertId;
            }

            // Check if the mutual fund already exists in the user's holdings
            const [existingFund] = await connection.query(
                `SELECT id, buy_quantity, sell_quantity, amount, buy_price, sell_price FROM mutualfund_holdings 
                 WHERE portfolio_id = ? AND scheme = ?`,
                [portfolio_id, scheme]
            );

            if (existingFund.length > 0) {
                // Fund already exists in holdings
                let existingBuyQuantity = parseFloat(existingFund[0].buy_quantity);
                let existingBuyNAV = parseFloat(existingFund[0].buy_price);
                let existingSellQuantity = parseFloat(existingFund[0].sell_quantity)
                //let currentAmount = parseFloat(existingFund[0].amount);
                let existingSellNAV = parseFloat(existingFund[0].sell_price);

                if (type === 'Buy') {
                    // Calculate new average NAV and updated quantity
                    const totalInvestment = (existingBuyQuantity * existingBuyNAV) + (quantity*nav);
                    const newBuyQuantity = existingBuyQuantity + quantity;
                    const newAverageNAV = totalInvestment / newBuyQuantity;

                    await connection.query(
                        `UPDATE mutualfund_holdings 
                         SET buy_quantity = ?, buy_price = ?, amount = ?, notes = ? 
                         WHERE portfolio_id = ? AND scheme = ?`,
                        [newBuyQuantity, newAverageNAV, newBuyQuantity*newAverageNAV, notes, portfolio_id, scheme]
                    );

                } else if (type === 'Sell') {
                    // Ensure the user has enough units to sell
                    if (quantity > existingBuyQuantity) {
                        await connection.rollback();
                        return res.status(400).json({ error: 'Cannot sell more than available quantity' });
                    }

                    const newBuyQuantity = existingBuyQuantity - quantity;
                    const newSellQuantity = existingSellQuantity + quantity;
                    const totalSellAmount = (existingSellQuantity * existingSellNAV) + (quantity*nav);
                    const newAvgSellPrice = newBuyQuantity > 0 ?  (totalSellAmount/newSellQuantity) : nav;

                    if (newBuyQuantity === 0) {
                        // If selling all units, delete the holding
                        await connection.query(
                            `DELETE FROM mutualfund_holdings WHERE portfolio_id = ? AND scheme = ?`,
                            [portfolio_id, scheme]
                        );
                    } else {
                        // Otherwise, update the holding
                        await connection.query(
                            `UPDATE mutualfund_holdings 
                             SET buy_quantity = ?, sell_quantity = ?, sell_price = ?, amount = ?, notes = ? 
                             WHERE portfolio_id = ?`,
                            [newBuyQuantity, newSellQuantity, newAvgSellPrice, newBuyQuantity*existingBuyNAV, notes, portfolio_id]
                        );
                    }
                }
            } else {

                const amount = quantity*nav

                const insertQuery = `
                    INSERT INTO mutualfund_holdings (portfolio_id, type, scheme, nav_date, buy_price, buy_quantity, amount, dividend, notes, sell_quantity, sell_price
                    ${sip_amount ? ', sip_amount' : ''} 
                    ${sip_start_date ? ', sip_start_date' : ''} 
                    ${sip_end_date ? ', sip_end_date' : ''} 
                    ${frequency ? ', frequency' : ''} 
                    ${no_of_installments ? ', no_of_installments' : ''}) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? 
                    ${sip_amount ? ', ?' : ''} 
                    ${sip_start_date ? ', ?' : ''} 
                    ${sip_end_date ? ', ?' : ''} 
                    ${frequency ? ', ?' : ''} 
                    ${no_of_installments ? ', ?' : ''});
                `;

                const values = [portfolio_id, type, scheme, nav_date, nav, quantity, amount, dividend, notes, 0, 0];
                if (sip_amount) values.push(sip_amount);
                if (sip_start_date) values.push(sip_start_date);
                if (sip_end_date) values.push(sip_end_date);
                if (frequency) values.push(frequency);
                if (no_of_installments) values.push(no_of_installments);

                await connection.query(insertQuery, values);

                /*
                // If mutual fund doesn't exist, insert a new record for a "Buy" transaction
                if (type === 'Buy') {
                    await connection.query(
                        `INSERT INTO mutualfund_holdings 
                         (portfolio_id, type, scheme, nav_date, buy_price, amount, buy_quantity, sell_quantity, dividend, notes) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [portfolio_id, type, scheme, nav_date, nav, amount, quantity, 0, dividend, notes]
                    );
                } else {
                    // Selling without prior holdings is not allowed
                    await connection.rollback();
                    return res.status(400).json({ error: 'Cannot sell a mutual fund that is not owned' });
                }*/
            }

            await connection.commit();
            return res.status(201).json({ message: 'Mutual fund transaction processed successfully' });
            
        } catch (error) {
            await connection.rollback();
            console.error('Error processing mutual fund transaction:', error);
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
                    u.user_id,
                    u.name,

                    -- Investment Cost (Stocks + Mutual Funds)
                    ROUND(SUM(h.amount), 2) AS stock_investment,
                    ROUND(SUM(mh.amount), 2) AS mutualfund_investment,
                    ROUND(SUM(h.amount) + SUM(mh.amount), 2) AS total_investment,

                    -- Unrealized Gain (Stocks + Mutual Funds)
                    ROUND(SUM((h.buy_quantity * h.buy_price) - h.amount), 2) AS unrealized_stock_gain,
                    ROUND(SUM((mh.buy_quantity * mh.buy_price) - mh.amount), 2) AS unrealized_mutual_gain,

                    -- Realized Gain (Stocks + Mutual Funds)
                    ROUND(SUM((h.sell_quantity * h.sell_price) - (h.sell_quantity * h.buy_price)), 2) AS realized_stock_gain,
                    ROUND(SUM((mh.sell_quantity * mh.sell_price) - (mh.sell_quantity * mh.buy_price)), 2) AS realized_mutual_gain,

                    -- Latest Value (Stocks + Mutual Funds)
                    ROUND(SUM(h.buy_quantity * h.buy_price), 2) AS latest_stock_value,
                    ROUND(SUM(mh.buy_quantity * mh.buy_price), 2) AS latest_mutual_value

                    FROM userstable u
                    JOIN portfolios p ON u.user_id = p.user_id
                    LEFT JOIN holdings h ON p.portfolio_id = h.portfolio_id
                    LEFT JOIN mutualfund_holdings mh ON p.portfolio_id = mh.portfolio_id

                    WHERE u.user_id = '56' 

                    GROUP BY u.user_id, u.name;

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

const portfolioStocks = async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Verify token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            await connection.rollback();
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            await connection.rollback();
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        if (!dbPool) {
            await connection.rollback();
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        console.log(decoded);

        const portfolioStocksQuery = `
        SELECT 
            h.stock_name,
            SUM(h.buy_quantity) AS total_quantity,
            SUM(h.amount) AS stock_investment,
            ROUND(SUM((h.buy_quantity * h.buy_price) - h.amount), 2) AS unrealized_gain,
            ROUND(SUM((COALESCE(h.sell_quantity, 0) * COALESCE(h.sell_price, 0)) - 
                      (COALESCE(h.sell_quantity, 0) * COALESCE(h.buy_price, 0))), 2) AS realized_gain
        FROM 
            userstable u
        JOIN 
            portfolios p ON u.user_id = p.user_id
        JOIN 
            holdings h ON p.portfolio_id = h.portfolio_id
        WHERE 
            u.user_id = ?
        GROUP BY 
            h.stock_name;
        `;

        const [stocks] = await connection.query(portfolioStocksQuery, [decoded.userId]);

        if (!stocks || stocks.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Portfolio is empty' });
        } 

        await connection.commit(); 
        res.status(200).json(stocks);
    } catch (error) {
        await connection.rollback();
        console.error('Error fetching portfolio stocks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release(); 
    }
};


const stocksTransaction = async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Verify token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            await connection.rollback();
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            await connection.rollback();
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (!dbPool) {
            await connection.rollback();
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        console.log(decoded);

        const portfolioStocksQuery = `
        SELECT 
            h.type,
            h.stock_name,
            h.exchange,
            h.date,
            h.buy_quantity,
            h.buy_price,
            h.sell_price,
            h.sell_quantity,
            h.amount,
            h.net_amount,
            h.total_charges
        FROM 
            userstable u
        JOIN 
            portfolios p ON u.user_id = p.user_id
        JOIN 
            holdings h ON p.portfolio_id = h.portfolio_id
        WHERE 
            u.user_id = ?;
        `;

        const [stocks] = await connection.query(portfolioStocksQuery, [decoded.userId]);

        if (!stocks || stocks.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Portfolio is empty' });
        } 

        await connection.commit();
        res.status(200).json(stocks);
    } catch (error) {
        await connection.rollback();
        console.error('Error fetching portfolio stocks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

const mutualsTransaction = async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Verify token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            await connection.rollback();
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            await connection.rollback();
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        if (!dbPool) {
            await connection.rollback();
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        console.log(decoded);

        const portfolioStocksQuery = `
        SELECT 
            mh.type,
            mh.scheme,
            mh.nav_date,
            mh.buy_quantity,
            mh.buy_price,
            mh.sell_price,
            mh.sell_quantity,
            mh.amount
        FROM 
            userstable u
        JOIN 
            portfolios p ON u.user_id = p.user_id
        JOIN 
            mutualfund_holdings mh ON p.portfolio_id = mh.portfolio_id
        WHERE 
            u.user_id = ?;
        `;

        const [stocks] = await connection.query(portfolioStocksQuery, [decoded.userId]);

        if (!stocks || stocks.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Portfolio is empty' });
        } 

        await connection.commit();
        res.status(200).json(stocks);
    } catch (error) {
        await connection.rollback();
        console.error('Error fetching portfolio stocks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};



module.exports = {
    getPortfolioSummary,
    addStockToPortfolio,
    addmutualFundToPortfolio,
    allocationChart, 
    portfolioStocks,
    stocksTransaction,
    mutualsTransaction
}