const admin = require("./firebase"); // Import the initialized admin instance

const sendNotification = async (deviceToken, title, body, data = {}) => {
  const message = {
    notification: { title, body },
    data, // Additional custom data
    token: deviceToken, // Receiver's FCM token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Example Usage
const deviceToken = "e7aeKLBl6rLDb19anKqhiE:APA91bE57EHtvZ9r8XlZHebRjAAqVSIljMUPVyklHao00xCXXqaLVRa_ySNfSXWWMUeoIprrBEpk4WxbFtUMXpiqIuQqPjvW3Ajbbb_z4t7AQcLOiX2EAXU";
sendNotification(deviceToken, "Hello!", "This is a push notification.");
