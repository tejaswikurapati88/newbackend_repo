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
const deviceToken = "e7aeKLBl6rLDb19anKqhiE:eylXPY6QgcH3XyQe7aeKLBl6rLDb19anKqhiE:APA91bGDZd8ylFn5dzTGdpj7uXrqk0dt3RyoSBn8az_oX-O8z4Jm_5jiTvT1lsDlAPDIVMw3_gFux8B4EUVJjLVs1GbMBOx7_APD4gh-eylXPY6QgcH3XyQ";
sendNotification(deviceToken, "Hello!", "This is a push notification.");
