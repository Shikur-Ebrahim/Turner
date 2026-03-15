import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // 1. Try to load from environment variable (full JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error("❌ [Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", e.message);
      }
    }

    // 2. Fallback to individual environment variables
    if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    // 3. Fallback to local file (using dynamic require to avoid bundler warnings)
    if (!serviceAccount) {
      try {
        const fs = require('fs');
        const path = require('path');
        const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
        if (fs.existsSync(keyPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        }
      } catch (fileError) {
        console.warn("⚠️ [Firebase Admin] Credentials not found via environment variables or local file.");
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || serviceAccount.projectId,
      });
      console.log("✅ [Firebase Admin] Formally initialized.");
    } else {
      console.error("❌ [Firebase Admin] No credentials found. Admin SDK not initialized.");
    }
  } catch (error) {
    console.error(
      "❌ [Firebase Admin] Unexpected error during initialization:",
      error && error.message ? error.message : error
    );
  }

}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export default admin;
