const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

require('dotenv').config();

// Initialize Firebase with error handling
let db, auth;
try {
  // service account JSON can be supplied via environment variables or a
  // local file.  When deploying to platforms like Heroku/Netlify it'd be
  // safer to use env vars.
  let serviceAccount;


  admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  auth = admin.auth();
  console.log("✓ Firebase initialized successfully");
} catch (error) {
  console.error("✗ Firebase initialization error:", error.message);
  process.exit(1);
}

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Login API - supports both Firebase ID token and local username/password
app.post("/login", async (req, res) => {
  try {
    const { idToken, user, password } = req.body;

    if (idToken) {
      // Firebase flow
      // Verify the token with Firebase
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      // Get or create user in Firestore
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // Create new user if doesn't exist
        await userRef.set({
          uid,
          email,
          displayName: decodedToken.name || "",
          createdAt: new Date(),
          lastLogin: new Date(),
        });
      } else {
        // Update last login
        await userRef.update({
          lastLogin: new Date(),
        });
      }

      // Create a custom JWT token for your app
      const token = jwt.sign({ uid, email }, process.env.JWT_SECRET || "your-secret-key", {
        expiresIn: "7d",
      });

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          uid,
          email,
          displayName: decodedToken.name || "",
        },
      });
    }

    // local username/password login
    if (user && password) {
      const snapshot = await db.collection('users').where('user', '==', user).limit(1).get();
      if (snapshot.empty) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const doc = snapshot.docs[0];
      const data = doc.data();
      const match = await bcrypt.compare(password, data.password || '');
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ uid: doc.id, user }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d',
      });
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: doc.id, user },
      });
    }

    // name/email login
    if (name && email) {
      const snapshot = await db.collection('users')
        .where('name', '==', name)
        .where('email', '==', email)
        .limit(1)
        .get();
      if (snapshot.empty) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const doc = snapshot.docs[0];
      const token = jwt.sign({ uid: doc.id, name, email }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d',
      });
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: doc.id, name, email },
      });
    }

    // neither flow satisfied
    res.status(400).json({ error: 'Provide idToken, user/password or name/email' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get Current User API
app.get("/current-user", verifyToken, async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout API (optional - for logging purposes)
app.post("/logout", verifyToken, async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create data API
app.post("/add-user", async (req, res) => {
  try {
    const { user, password, name, email } = req.body;

    // require either user/password or name/email
    if ((!user || !password) && (!name || !email)) {
      return res.status(400).json({ error: 'Provide either user/password or name/email' });
    }

    const data = { createdAt: new Date() };
    if (user && password) {
      data.user = user;
      data.password = await bcrypt.hash(password, 10);
    }
    if (name && email) {
      data.name = name;
      data.email = email;
    }

    const docRef = await db.collection("users").add(data);

    res.status(200).json({
      message: "User added successfully",
      id: docRef.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get users API
app.get("/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daybook APIs
// POST /daybook - create a daybook entry for the authenticated user
app.post('/daybook', verifyToken, async (req, res) => {
  try {
    const { date, description, amount, type } = req.body;

    if (!date || !description || amount === undefined) {
      return res.status(400).json({ error: 'date, description and amount are required' });
    }

    const uid = req.user.uid;

    const entry = {
      uid,
      date: new Date(date),
      description,
      amount,
      type: type || 'general',
      createdAt: new Date(),
    };

    const docRef = await db.collection('daybook').add(entry);

    res.status(200).json({ message: 'Daybook entry created', id: docRef.id });
  } catch (error) {
    console.error('Daybook POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /daybook - list daybook entries for the authenticated user
// Optional query params: start, end (ISO date strings)
app.get('/daybook', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { start, end } = req.query;

    let ref = db.collection('daybook').where('uid', '==', uid);

    if (start) {
      ref = ref.where('date', '>=', new Date(start));
    }
    if (end) {
      ref = ref.where('date', '<=', new Date(end));
    }

    // Firestore requires that range filters are used with proper indexes; ordering by date
    const snapshot = await ref.orderBy('date', 'desc').get();

    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(entries);
  } catch (error) {
    console.error('Daybook GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
}).on("error", (error) => {
  console.error("✗ Server error:", error.message);
  process.exit(1);
});