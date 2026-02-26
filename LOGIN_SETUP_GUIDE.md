# SmartQ ERP - Login System Setup Guide

## Overview
This guide explains how to set up and use the login system with Firebase authentication.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account with a project created
- Git (optional)

## Setup Instructions

### 1. Firebase Project Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Email/Password Authentication**
   - In Firebase Console, go to **Authentication**
   - Click **Sign-in method**
   - Enable **Email/Password**
   - Save changes

3. **Get Firebase Configuration**
   - In Firebase Console, go to **Project Settings** (gear icon)
   - Copy your config object (Web SDK snippet)
   - You'll need:
     - API Key
     - Auth Domain
     - Project ID
     - Storage Bucket
     - Messaging Sender ID
     - App ID

### 2. Server Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Generate Service Account Key**
   - In Firebase Console, go to **Project Settings**
   - Click **Service Accounts** tab
   - Click **Generate new private key**
   - Save the JSON file as `serviceAccountKey.json` in the server folder
   - **⚠️ Important: Keep this file secret and don't commit to Git**

3. **Create Environment Configuration**
   - Copy `.env.local.example` to `.env.local`
   - Update `JWT_SECRET` with a strong random string
   - Example: `JWT_SECRET=your-super-secret-key-change-this-12345`

4. **Update server/index.js**
   - If using `.env` file, add dotenv configuration:
   ```javascript
   require('dotenv').config();
   const JWT_SECRET = process.env.JWT_SECRET || 'fallback-key';
   ```

5. **Start Server**
   ```bash
   npm start
   // or with nodemon for development
   npx nodemon index.js
   ```
   - Server runs on `http://localhost:5000`

### 3. Client Setup

1. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Create Environment Configuration**
   - Copy `.env.local.example` to `.env.local`
   - Add your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_URL=http://localhost:5000
   ```

3. **Start Client**
   ```bash
   npm run dev
   ```
   - Client runs on `http://localhost:5173`

## API Endpoints

### POST /login
Authenticates a user with Firebase and returns a JWT token.

**Request:**
```json
{
  "idToken": "firebase_id_token_from_client"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_for_api_calls",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "User Name"
  }
}
```

### GET /current-user
Get current user information (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "user": {
    "id": "user_document_id",
    "uid": "firebase_uid",
    "email": "user@example.com",
    "displayName": "User Name",
    "createdAt": "2024-02-20T10:30:00Z",
    "lastLogin": "2024-02-20T15:45:00Z"
  }
}
```

### POST /logout
Logout endpoint (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

## Flow Description

### Login Flow
1. User enters email and password in the login form
2. Firebase authenticates the user
3. If successful, Firebase returns an ID token
4. Client sends ID token to backend `/login` endpoint
5. Backend verifies token with Firebase
6. Backend creates/updates user in Firestore
7. Backend returns JWT token and user data
8. Client stores token and user info in localStorage
9. Client redirects to dashboard/home page

### Authenticated Requests
1. Client includes JWT token in `Authorization: Bearer <token>` header
2. Server middleware validates JWT
3. If valid, request proceeds; if invalid, returns 401

## File Structure

```
client/
├── src/
│   ├── components/
│   │   └── Login.tsx          # Login component
│   ├── services/
│   │   └── api.ts             # API utility functions
│   ├── styles/
│   │   └── Login.css          # Login styles
│   ├── firebase.ts            # Firebase config
│   ├── App.tsx                # Main app with auth state
│   ├── App.css
│   └── main.tsx
├── .env.local                 # Environment variables (create this)
├── .env.local.example         # Example env file
└── package.json

server/
├── index.js                   # Main server file with login API
├── serviceAccountKey.json     # Firebase credentials (create this)
├── .env.local                 # Environment variables (create this)
├── .env.local.example         # Example env file
└── package.json
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to Git
   - Use `.env.local.example` as a template

2. **Service Account Key**
   - Never commit `serviceAccountKey.json` to Git
   - Add to `.gitignore`:
   ```
   server/serviceAccountKey.json
   client/.env.local
   server/.env.local
   ```

3. **JWT Secret**
   - Use a strong random string
   - Change the default in production
   - Use a secure secret management system

4. **Token Storage**
   - Tokens are stored in localStorage (consider using httpOnly cookies for production)
   - Implement token refresh logic for long-lived sessions

## Troubleshooting

### "Invalid idToken" Error
- Make sure the Firebase project is correctly configured
- Verify the ID token is fresh (not expired)
- Check Firebase credentials in backend

### CORS Errors
- Server is configured with `cors()` middleware
- Verify server is running on the correct port
- Check `VITE_API_URL` in client environment

### Login Not Working
1. Check browser console for errors
2. Check server terminal for error logs
3. Verify Firebase is initialized in `client/src/firebase.ts`
4. Ensure JWT_SECRET matches between client and server calls

### 401 Unauthorized on API Calls
- Make sure token is properly stored in localStorage
- Verify token hasn't expired
- Check Authorization header format: `Bearer <token>`

## Next Steps

1. Add input validation
2. Implement password reset functionality
3. Add email verification
4. Implement role-based access control
5. Add more user fields to Firestore
6. Create protected routes in the client

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Vite Documentation](https://vitejs.dev)
