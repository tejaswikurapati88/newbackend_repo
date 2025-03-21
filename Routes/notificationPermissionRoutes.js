const express = require("express");
const router = express.Router();
const {
  storeUserNotification,
  getUserNotifications,
  updateUserNotificationPermission,
} = require("../Controllers/notificationpermissionsController");

// Route for storing a new notification
router.post("/", storeUserNotification);

// Route for fetching user-specific notifications
router.get("/", getUserNotifications);

// Route for updating notification permissions for a user
router.put("/", updateUserNotificationPermission);

module.exports = router;
