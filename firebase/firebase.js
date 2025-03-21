const admin = require("firebase-admin");
import dotenv from "dotenv";
dotenv.config();

// const serviceAccount = require("./firebase.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
