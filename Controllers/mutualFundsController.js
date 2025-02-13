const dbPool = require("./dbPool");

//controller for get all MutualFunds

const getAllFunds = async (req, res) => {
  try {
    const [rows] = await dbPool.query(`SELECT * FROM mutualfunds_details`);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No mutual funds found",
      });
    }

    //Response
    return res.status(200).json({
      success: true,
      message: "Successfully fetched all mutual funds",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching mutualFunds:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getAllFunds };
