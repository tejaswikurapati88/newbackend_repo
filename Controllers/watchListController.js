const { json } = require('express');
const dbPool = require('./dbPool')
const jwt = require('jsonwebtoken');
require('dotenv').config()


const getWatchlists = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!dbPool) {
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        // Fetch watchlists and their items for the user
        const query = `
            select
                w.watchlist_id,
                w.name
            from 
                watchlists w
            where
                w.user_id = ?;
                    `;

        const [result] = await dbPool.query(query, [decoded.userId]);

        console.log(result)
        return res.status(200).json(result);

        // Organizing watchlists with their items
        const watchlists = {};
        result.forEach(row => {
            if (!watchlists[row.watchlist_id]) {
                watchlists[row.watchlist_id] = {
                    watchlist_id: row.watchlist_id,
                    name: row.watchlist_name,
                    items: []
                };
            }

            if (row.item_id) {
                watchlists[row.watchlist_id].items.push({
                    item_id: row.item_id,
                    asset_type: row.asset_type,
                    asset_symbol: row.asset_symbol,
                    added_at: row.added_at
                });
            }
        });
        console.log(watchlists)

        return res.status(200).json(Object.values(watchlists));
    } catch (error) {
        console.error('Error fetching watchlist:', error);

        const statusCode = error.name === 'JsonWebTokenError' ? 401 : 500;
        return res.status(statusCode).json({ error: error.message || 'Internal Server Error' });
    }
};

const addToWatchlist = async (req, res) => {
    try {
        // Extract and verify JWT token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log(decoded)
        const userId = decoded.userId;

        if (!dbPool) {
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        let { watchlist_id, asset_type, asset_symbol } = req.body;
        console.log(req.body)

        // Validate required input fields
        if (!asset_type || !asset_symbol) {
            return res.status(400).json({ error: 'Asset type and symbol are required' });
        }

        // Normalize asset symbol to uppercase for consistency
        asset_symbol = asset_symbol.toUpperCase();

        // Check if the user provided a watchlist ID
        let watchlistId = watchlist_id;
        if (!watchlistId) {
            // If no watchlist_id provided, check if the user has a default one
            const [existingWatchlist] = await dbPool.execute(
                'SELECT watchlist_id FROM watchlists WHERE user_id = ? ORDER BY created_at LIMIT 1',
                [userId]
            );

            if (existingWatchlist.length > 0) {
                watchlistId = existingWatchlist[0].watchlist_id;
            } else {
                // If no existing watchlist, create a default one
                const [watchlistResult] = await dbPool.execute(
                    'INSERT INTO watchlists (user_id, name) VALUES (?, ?)',
                    [userId, 'My Watchlist']
                );
                watchlistId = watchlistResult.insertId;
            }
        } else {
            // Ensure the watchlist belongs to the user
            const [watchlistCheck] = await dbPool.query(
                'SELECT watchlist_id FROM watchlists WHERE watchlist_id = ? AND user_id = ?',
                [watchlistId, userId]
            );

            if (watchlistCheck.length === 0) {
                const [watchlistResult] = await dbPool.query(
                    'INSERT INTO watchlists (user_id, name) VALUES (?, ?)',
                    [userId, `My Watchlist ${watchlistId}`]
                );
                watchlistId = watchlistResult.insertId;

                return res.status(200).json({ message: 'Asset added to watchlist', watchlist_id: watchlistId });
            }
        }

        // Check if the asset is already in the watchlist (prevent duplicates)
        const [existingAsset] = await dbPool.execute(
            'SELECT item_id FROM watchlist_items WHERE watchlist_id = ? AND asset_symbol = ?',
            [watchlistId, asset_symbol]
        );

        if (existingAsset.length > 0) {
            return res.status(409).json({ error: 'Asset already exists in the watchlist' });
        }

        // Insert asset into watchlist_items
        await dbPool.execute(
            'INSERT INTO watchlist_items (watchlist_id, asset_type, asset_symbol) VALUES (?, ?, ?)',
            [watchlistId, asset_type, asset_symbol]
        );

        res.status(201).json({ message: 'Asset added to watchlist', watchlist_id: watchlistId });

    } catch (error) {
        console.error('Error adding to watchlist:', error);

        let statusCode = 500;
        if (error.name === 'JsonWebTokenError') statusCode = 401;
        if (error.code === 'ER_NO_REFERENCED_ROW_2') statusCode = 400; // Foreign key constraint failure

        res.status(statusCode).json({ error: error.message || 'Internal Server Error' });
    }
};

const getAssetFromWatchlist = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.userId;

        if (!dbPool) {
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        let watchlistId = req.query.watchlist_id;
        if (!watchlistId) {
            return res.status(400).json({ error: "Missing 'watchlist_id' query parameter" });
        }

        console.log("Query param:", watchlistId);

        const query = `
            SELECT wi.watchlist_id, wi.asset_type, wi.asset_symbol
            FROM watchlist_items wi
            JOIN watchlists w ON w.watchlist_id = wi.watchlist_id
            JOIN userstable u ON u.user_id = w.user_id
            WHERE u.user_id = ? AND w.watchlist_id = ?;
        `;

        const [result] = await dbPool.query(query, [userId, watchlistId]);

        console.log("Query result:", result);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching assets from watchlist:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const createWatchlist = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.userId;

        if (!dbPool) {
            return res.status(500).json({ error: 'Database connection is not established' });
        }

        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Watchlist name is required" });
        }

        const createWatchlistQuery = `INSERT INTO watchlists (user_id, name) VALUES (?, ?)`;
        const [result] = await dbPool.query(createWatchlistQuery, [userId, name]);

        return res.status(201).json({ message: "Watchlist created successfully", watchlistId: result.insertId });
    } catch (error) {
        console.error("Error creating watchlist:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = {
    getWatchlists,
    addToWatchlist,
    getAssetFromWatchlist,
    createWatchlist
}