const dbPool = require("./dbPool");

require("dotenv").config();

const getstocks = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stocksQuery = `select * from stocks;`;
    const [stocks] = await dbPool.query(stocksQuery);
    res.status(200).json(stocks);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getcompstocks = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stockslistQuery = `select * from comapanies_stocks_list limit 46;`;
    const [stockslist] = await dbPool.query(stockslistQuery);
    res.status(200).json(stockslist);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getcompstockswithpage = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const { pagenum } = req.params;
    const offset = pagenum * 10 - 10;
    const stockslistQuery = `select * from comapanies_stocks_list limit 10 offset ${offset};`;
    const [stockslist] = await dbPool.query(stockslistQuery);

    // Convert Buffer to Base64 for icons
    const formattedResults = stockslist.map((row) => {
      if (row.icons) {
        return {
          ...row,
          icons: `data:image/png;base64,${row.icons.toString("base64")}`,
        };
      }
      return row;
    });

    res.status(200).json(formattedResults);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getnifty500comp = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const { pagenum } = req.params;
    const offset = pagenum * 10 - 10;
    const niftyQuery = `select * from Nifty500_Company_List Limit 10 offset ${offset} ;`;
    const [nifty500] = await dbPool.query(niftyQuery);

    // Convert Buffer to Base64 for icons
    const formattedResults = nifty500.map((row) => {
      if (row.icons) {
        return {
          ...row,
          icons: `data:image/png;base64,${row.icons.toString("base64")}`,
        };
      }
      return row;
    });

    res.status(200).json(formattedResults);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getnifty100 = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stockslistQuery = `select * from comapanies_stocks_list where NIFTY_100 != '-' limit 41;`;
    const [stockslist] = await dbPool.query(stockslistQuery);

    // Convert Buffer to Base64 for icons
    const formattedResults = stockslist.map((row) => {
      if (row.icons) {
        return {
          ...row,
          icons: `data:image/png;base64,${row.icons.toString("base64")}`,
        };
      }
      return row;
    });

    res.status(200).json(formattedResults);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getdummycompstocks = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stockslistQuery = `select * from dummy_stocks_list limit 46;`;
    const [stockslist] = await dbPool.query(stockslistQuery);
    res.status(200).json(stockslist);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getsmallCapCompanies = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stockslistQuery = `select * from 

(SELECT *,
  CASE
    WHEN Market_cap LIKE '%T' THEN CAST(SUBSTRING_INDEX(Market_cap, ' ', 1) AS DECIMAL(10,2)) * 1000000000000
    WHEN Market_cap LIKE '%B' THEN CAST(SUBSTRING_INDEX(Market_cap, ' ', 1) AS DECIMAL(10,2)) * 1000000000
    ELSE 0
  END AS market_cap_in_crore
FROM comapanies_stocks_list) as created_table

where market_cap_in_crore < 5000000000
order by market_cap_in_crore desc
limit 100;`;
    const [stockslist] = await dbPool.query(stockslistQuery);

    // Convert Buffer to Base64 for icons
    const formattedResults = stockslist.map((row) => {
      if (row.icons) {
        return {
          ...row,
          icons: `data:image/png;base64,${row.icons.toString("base64")}`,
        };
      }
      return row;
    });

    res.status(200).json(formattedResults);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getmidCapCompanies = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stockslistQuery = `select * from 

(SELECT *,
  CASE
    WHEN Market_cap LIKE '%T' THEN CAST(SUBSTRING_INDEX(Market_cap, ' ', 1) AS DECIMAL(10,2)) * 1000000000000
    WHEN Market_cap LIKE '%B' THEN CAST(SUBSTRING_INDEX(Market_cap, ' ', 1) AS DECIMAL(10,2)) * 1000000000
    ELSE 0
  END AS market_cap_in_crore
FROM comapanies_stocks_list) as created_table

where market_cap_in_crore > 50000000000 and market_cap_in_crore < 200000000000
order by market_cap_in_crore desc
limit 100;`;
    const [stockslist] = await dbPool.query(stockslistQuery);

    // Convert Buffer to Base64 for icons
    const formattedResults = stockslist.map((row) => {
      if (row.icons) {
        return {
          ...row,
          icons: `data:image/png;base64,${row.icons.toString("base64")}`,
        };
      }
      return row;
    });

    res.status(200).json(formattedResults);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

const getlargeCapCompanies = async (req, res) => {
  try {
    if (!dbPool) {
      return res
        .status(500)
        .json({ error: "Database connection is not established" });
    }
    const stockslistQuery = `select * from 

(SELECT *,
  CASE
    WHEN Market_cap LIKE '%T' THEN CAST(SUBSTRING_INDEX(Market_cap, ' ', 1) AS DECIMAL(10,2)) * 1000000000000
    WHEN Market_cap LIKE '%B' THEN CAST(SUBSTRING_INDEX(Market_cap, ' ', 1) AS DECIMAL(10,2)) * 1000000000
    ELSE 0
  END AS market_cap_in_crore
FROM comapanies_stocks_list) as created_table

where market_cap_in_crore > 200000000000
order by market_cap_in_crore desc
limit 100;`;
    const [stockslist] = await dbPool.query(stockslistQuery);

    // Convert Buffer to Base64 for icons
    const formattedResults = stockslist.map((row) => {
      if (row.icons) {
        return {
          ...row,
          icons: `data:image/png;base64,${row.icons.toString("base64")}`,
        };
      }
      return row;
    });

    res.status(200).json(formattedResults);
  } catch (e) {
    console.error("Error fetching users:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//--------------------------------------------------------------------------------------------------------------------------

module.exports = {
  getstocks,
  getcompstocks,
  getcompstockswithpage,
  getnifty500comp,
  getnifty100,
  getdummycompstocks,
  getsmallCapCompanies,
  getmidCapCompanies,
  getlargeCapCompanies,
};
