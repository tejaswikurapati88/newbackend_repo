const express = require("express");
const router = express.Router();
const {
  getAllNotifications,
  storeNotifications,
  readNotification,
} = require("../Controllers/notificationsController");

//Route for Notifications,
router.get("/",getAllNotifications);
router.post("/",storeNotifications);
router.patch("/",readNotification);

module.exports = router;
