const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Load the JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
