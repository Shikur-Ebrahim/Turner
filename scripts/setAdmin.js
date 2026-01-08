const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const admin = require("../lib/firebaseAdmin.js");

const email = process.argv[2];

if (!email) {
    console.error("Usage: node scripts/setAdmin.js email");
    process.exit(1);
}

async function setAdmin() {
    try {
        // 1️⃣ Get user from Firebase Auth
        const user = await admin.auth().getUserByEmail(email);

        // 2️⃣ Set custom admin claim
        await admin.auth().setCustomUserClaims(user.uid, {
            admin: true,
        });

        // 3️⃣ Create / update Firestore user document
        const db = admin.firestore();

        await db.collection("users").doc(user.uid).set(
            {
                email: user.email,
                role: "admin",
                isAdmin: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        console.log("✅ Admin role applied:", email);
        console.log("✅ Admin data stored in Firestore (users collection)");

        process.exit();
    } catch (error) {
        console.error("❌ Error setting admin role:", error.message);
        process.exit(1);
    }
}

setAdmin().catch(console.error);
