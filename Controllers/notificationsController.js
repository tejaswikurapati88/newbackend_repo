const dbPool = require("./dbPool");
const moment = require("moment");

const getAllNotifications = async (req, res) => {
  try {
    if (!dbPool) {
      return res.status(500).json({
        error: "Database connection is not established",
      });
    }

    const { page = 1 } = req.params;
    const limit = 10;
    const offset = (page - 1) * limit;

    const query = `SELECT * FROM notifications LIMIT ? OFFSET ?`;
    const [notifications] = await dbPool.query(query, [limit, offset]);
    const formattedNotifications = notifications.map((notification) => {
      const createdAt = moment(notification.created_at);
      const now = moment();
      let formattedDate;

      if (createdAt.isSame(now, "day")) {
        formattedDate = `Today ${createdAt.format("hh:mm A")}`;
      } else if (createdAt.isSame(now.subtract(1, "day"), "day")) {
        formattedDate = `Yesterday ${createdAt.format("hh:mm A")}`;
      } else {
        formattedDate = createdAt.format("DD MMM, YYYY hh:mm A");
      }

      return {
        ...notification,
        created_at: formattedDate,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Successfully fetched notifications",
      data: formattedNotifications,
      currentPage: parseInt(page),
      perPage: limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// To store a new notification
const storeNotifications = async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const [result] = await dbPool.query(
      `INSERT INTO notifications (message, user_id,created_at) VALUES (?, ?, Now())`,
      [message, user_id]
    );

    // Response
    return res.status(201).json({
      success: true,
      message: "Notification stored successfully",
      data: { id: result.insertId, message, user_id },
    });
  } catch (error) {
    console.error("Error storing notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// To mark a notification as read
const readNotification = async (req, res) => {
  try {
    const { notificationId } = req.query;
    const [result] = await dbPool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [notificationId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Response
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllNotifications,
  storeNotifications,
  readNotification,
};
