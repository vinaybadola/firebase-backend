/* This JavaScript code is setting up a connection to Firebase using the Firebase Admin SDK. Here's a
breakdown of what each part is doing: 
1. `const admin = require('firebase-admin');`: This line imports the Firebase Admin SDK for Node.js
2. `admin.initializeApp({ // ... });`: This line initializes the Firebase Admin SDK with the provided
configuration. The configuration object contains the project's credentials, which are used to authenticate
the application.
Please replace `'./firebaseAdminConfig.json'` with the path to your Firebase service account key JSON file.
3. Go to firebase console > project settings > service accounts > firebase admin sdk > generate the .json file 

*/
const admin = require("firebase-admin");

const serviceAccount = require("./firebaseAdminConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
