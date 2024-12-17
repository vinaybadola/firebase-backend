/* This JavaScript code is setting up a connection to Firebase using the Firebase Admin SDK. Here's a
breakdown of what each part is doing: 
1. `const admin = require('firebase-admin');`: This line imports the Firebase Admin SDK for Node.js
2. `admin.initializeApp({ // ... });`: This line initializes the Firebase Admin SDK with the provided
configuration. The configuration object contains the project's credentials, which are used to authenticate
the application.
Please replace `'./firebaseAdminConfig.json'` with the path to your Firebase service account key JSON file.
3. Go to firebase console > project settings > service accounts > firebase admin sdk > generate the .json file 

*/
require("dotenv").config();
const admin = require("firebase-admin");

const serviceAccount = {
  type: process.env.FIREBASE_TYPE || "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), 
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain : process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
