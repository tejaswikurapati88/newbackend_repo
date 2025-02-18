const dbPool = require("./dbPool");

const getAllData = async (req, res) => {
  try {
    const [stockRows] = await dbPool.query(`SELECT * FROM dummy_stocks_list`);
    const [fundRows] = await dbPool.query(
      `SELECT * FROM mutualfunds_directplan_details`
    );

    const rows = [...stockRows, ...fundRows];

    if (rows.length === 0) {
      return res.status(401).json({
        error: true,
        message: "Data not found",
      });
    }

    //sending response
    return res.status(200).json({
      success: true,
      message: "Successfully get all data",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Something wrong unable to send all data",
    });
  }
};

module.exports = { getAllData };
