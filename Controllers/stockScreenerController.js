const dbPool = require("./dbPool");


const sectorAnalyst = async (req, res) => {
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const stockslistQuery = `
            SELECT 
                company,
                ltp_inr,
                change_percent,
                market_cap_cr,
                roe,
                pe,
                pbv,
                ev_ebitda,
                sales_growth_5y,
                profit_growth_5y,
                clarification
            FROM dummy_stocks_list
            ;
        `;
        const [stockslist] = await dbPool.query(stockslistQuery)
        res.status(200).json(stockslist);
    } catch(e){
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const stockSector = async (req, res) => {
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const stockslistQuery = `
            SELECT 
                company,
                ltp_inr,
                change_percent,
                market_cap_cr,
                High_52W_INR,
                Low_52W_INR,
                sector,
                pe,
                clarification
            FROM dummy_stocks_list
            ;
        `;
        const [stockslist] = await dbPool.query(stockslistQuery)
        res.status(200).json(stockslist);
    } catch(e){
        console.error('Error in fetching details :', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const stockIndex = async (req, res) => {
    try{
        if (!dbPool){
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const stockslistQuery = `
            SELECT 
                company,
                ltp_inr,
                change_percent,
                market_cap_cr,
                High_52W_INR,
                Low_52W_INR,
                stock_index,
                pe,
                clarification
            FROM dummy_stocks_list
            ;
        `;
        const [stockslist] = await dbPool.query(stockslistQuery)
        res.status(200).json(stockslist);
    } catch(e){
        console.error('Error in fetching details :', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const stockCalender = async (req, res) => {
    try {
        if (!dbPool) {
            return res.status(500).json({error: 'Database connection is not established'})
        }
        const stockslistQuery = `
            SELECT 
                company,
                ltp_inr,
                change_percent,
                market_cap_cr,
                High_52W_INR,
                Low_52W_INR,
                DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
                pe,
                clarification
            FROM dummy_stocks_list
            ;
        `;
        const [stockslist] = await dbPool.query(stockslistQuery)
        res.status(200).json(stockslist);
    } catch(e) {
        console.error('Error in fetching details :', e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports ={
    sectorAnalyst,
    stockSector,
    stockIndex,
    stockCalender
}