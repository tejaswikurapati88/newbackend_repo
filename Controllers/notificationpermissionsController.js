const dbPool = require("./dbPool");
const moment = require("moment");

// Get notifications for a specific user
const getUserNotifications = async (req, res) => {
  try {
    const { user_id, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const query = `
      SELECT unp.*, nt.type AS notification_type_name
      FROM user_notification_permissions unp
      JOIN notification_types nt ON unp.notification_type_id = nt.id
      WHERE unp.user_id = ?
      ORDER BY unp.created_at DESC
      LIMIT ? OFFSET ?`;

    const [notifications] = await dbPool.query(query, [user_id, limit, offset]);

    return res.status(200).json({
      success: true,
      message: "User notifications fetched successfully",
      data: notifications,
      currentPage: parseInt(page),
      perPage: limit,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Store a notification for a user
const storeUserNotification = async (payload) => {
  try {
    const { user_id } = payload;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Fetch all notification types
    const [notificationTypes] = await dbPool.query(
      `SELECT id FROM notification_types`
    );

    if (!notificationTypes.length) {
      return res
        .status(404)
        .json({ success: false, message: "No notification types found" });
    }

    // Prepare bulk insert values
    const values = notificationTypes.map(({ id }) => [user_id, id, 0]);

    // Insert into user_notification_permissions
    const [result] = await dbPool.query(
      `INSERT INTO user_notification_permissions (user_id, notification_type_id, is_enabled) VALUES ?`,
      [values]
    );

    return {
      success: true,
      message: "Notifications stored successfully",
      inserted_count: result.affectedRows,
    };
  } catch (error) {
    console.error("Error storing user notification:", error);
    return { error: "Internal Server Error" };
  }
};

// Update a user's notification permission
const updateUserNotificationPermission = async (req, res) => {
  try {
    const { user_id, permissions } = req.body; // Expecting an array of permissions
    if (!user_id || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and an array of permissions are required",
      });
    }

    const updatePromises = permissions.map(
      ({ notification_type_id, is_enabled }) =>
        dbPool.query(
          `UPDATE user_notification_permissions 
         SET is_enabled = ? 
         WHERE user_id = ? AND notification_type_id = ?`,
          [is_enabled, user_id, notification_type_id]
        )
    );

    const results = await Promise.all(updatePromises);
    const affectedRows = results.reduce(
      (sum, [result]) => sum + result.affectedRows,
      0
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching records found for update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User notification permissions updated successfully",
      updated_count: affectedRows,
    });
  } catch (error) {
    console.error("Error updating notification permissions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getUserNotifications,
  storeUserNotification,
  updateUserNotificationPermission,
};
