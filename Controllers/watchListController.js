const { json } = require("express");
const dbPool = require("./dbPool");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const createNewWatchList = async (req, res) => {
  const { name } = req.body;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: No token provided",
      });
    }

    //decode the token get user id from token
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const user_id = decode.userId;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

    //check name is already exist or not
    const checkQuery = `SELECT watchlist_id FROM watchlists WHERE user_id=? AND name=?`;
    const [existingWatchlist] = await dbPool.execute(checkQuery, [
      user_id,
      name,
    ]);

    if (existingWatchlist.length > 0) {
      return res.status(400).json({
        error: `A watchlist with this name already exists.`,
      });
    }

    //add watch list into the watchlist table
    const query = `INSERT INTO watchlists (user_id,name) 
      VALUES (?,?)
    `;
    const [result] = await dbPool.execute(query, [user_id, name]);

    //response
    return res.status(200).json({
      success: true,
      message: `Successfully create new watchlist ${name}`,
      watchlistId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating watchlist:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------------------------------------------------------------------------------------------------------

const renameExistingWatchlist = async (req, res) => {
  const { watchlist_id, name } = req.body;

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: No token provided",
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const user_id = decode.userId;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

    // Check if the watchlist exists and belongs to the user
    const checkQuery = `SELECT watchlist_id FROM watchlists WHERE watchlist_id = ? AND user_id = ?`;
    const [existingWatchlist] = await dbPool.execute(checkQuery, [
      watchlist_id,
      user_id,
    ]);

    if (existingWatchlist.length === 0) {
      return res.status(404).json({
        error: "Watchlist not found or you don't have permission to rename it.",
      });
    }

    // Check if the new name is already taken by another watchlist of the same user
    const nameCheckQuery = `SELECT watchlist_id FROM watchlists WHERE user_id = ? AND name = ?`;
    const [duplicateName] = await dbPool.execute(nameCheckQuery, [
      user_id,
      name,
    ]);

    if (duplicateName.length > 0) {
      return res.status(400).json({
        error: "A watchlist with this name already exists.",
      });
    }

    //Update watchlist name
    const updateQuery = `UPDATE watchlists SET name = ? WHERE watchlist_id=? AND user_id = ?`;
    await dbPool.execute(updateQuery, [name, watchlist_id, user_id]);

    //response
    return res.status(200).json({
      success: true,
      message: `Watchlist renamed ${name}`,
    });
  } catch (error) {
    console.error("Error renaming watchlist:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
//------------------------------------------------------------------------------------------------------------------------

const deleteWatchlist = async (req, res) => {
  const { watchlist_id } = req.body;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY);
    const user_id = decode.userId;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

    //delete watchlist
    const deleteQuery = `DELETE FROM watchlists WHERE watchlist_id = ? AND user_id = ?`;
    await dbPool.execute(deleteQuery, [watchlist_id, user_id]);

    //response
    return res.status(200).json({
      success: true,
      message: "Watchlist deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting watchlist:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------------------------------------------------------------------------------------------------------

const getWatchlist = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

        // Fetch watchlists and their items for the user
        const query = `
            SELECT 
                w.watchlist_id, 
                w.name AS watchlist_name, 
                wi.item_id, 
                wi.asset_type, 
                wi.asset_symbol, 
                wi.added_at
            FROM watchlists w
            LEFT JOIN watchlist_items wi ON w.watchlist_id = wi.watchlist_id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC, wi.added_at DESC;
        `;

        const [result] = await dbPool.query(query, [decoded.userId]);

    // Organizing watchlists with their items
    const watchlists = {};
    result.forEach((row) => {
      if (!watchlists[row.watchlist_id]) {
        watchlists[row.watchlist_id] = {
          watchlist_id: row.watchlist_id,
          name: row.watchlist_name,
          items: [],
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

    return res.status(200).json(Object.values(watchlists));
  } catch (error) {
    console.error("Error fetching watchlist:", error);

    const statusCode = error.name === "JsonWebTokenError" ? 401 : 500;
    return res
      .status(statusCode)
      .json({ error: error.message || "Internal Server Error" });
  }
};

//------------------------------------------------------------------------------------------------------------------------

const addToWatchlist = async (req, res) => {
  try {
    // Extract and verify JWT token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log(decoded);
    const userId = decoded.userId;

    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }

        let { watchlist_id, asset_type, asset_symbol } = req.body;

    // Validate required input fields
    if (!asset_type || !asset_symbol) {
      return res
        .status(400)
        .json({ error: "Asset type and symbol are required" });
    }

    // Normalize asset symbol to uppercase for consistency
    asset_symbol = asset_symbol.toUpperCase();

    // Check if the user provided a watchlist ID
    let watchlistId = watchlist_id;
    if (!watchlistId) {
      // If no watchlist_id provided, check if the user has a default one
      const [existingWatchlist] = await dbPool.execute(
        "SELECT watchlist_id FROM watchlists WHERE user_id = ? ORDER BY created_at LIMIT 1",
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
            const [watchlistCheck] = await dbPool.execute(
                'SELECT watchlist_id FROM watchlists WHERE watchlist_id = ? AND user_id = ?',
                [watchlistId, userId]
            );

            if (watchlistCheck.length === 0) {
                return res.status(403).json({ error: 'Unauthorized: Watchlist not found or does not belong to user' });
            }
        }

    // Check if the asset is already in the watchlist (prevent duplicates)
    const [existingAsset] = await dbPool.execute(
      "SELECT item_id FROM watchlist_items WHERE watchlist_id = ? AND asset_symbol = ?",
      [watchlistId, asset_symbol]
    );

    if (existingAsset.length > 0) {
      return res
        .status(409)
        .json({ error: "Asset already exists in the watchlist" });
    }

    // Insert asset into watchlist_items
    await dbPool.execute(
      "INSERT INTO watchlist_items (watchlist_id, asset_type, asset_symbol) VALUES (?, ?, ?)",
      [watchlistId, asset_type, asset_symbol]
    );

    res
      .status(201)
      .json({ message: "Asset added to watchlist", watchlist_id: watchlistId });
  } catch (error) {
    console.error("Error adding to watchlist:", error);

    let statusCode = 500;
    if (error.name === "JsonWebTokenError") statusCode = 401;
    if (error.code === "ER_NO_REFERENCED_ROW_2") statusCode = 400; // Foreign key constraint failure

    res
      .status(statusCode)
      .json({ error: error.message || "Internal Server Error" });
  }
};


module.exports = {
    getWatchlist,
    addToWatchlist,
    createNewWatchList,
    renameExistingWatchlist,
    deleteWatchlist
}