const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK using the service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Optional helpers
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  storage,
};
