import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin"; // uses the adminAuth export
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";


export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { phoneNumber } = await req.json();

    // Validate inputs
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // The password we always reset to
    const newPassword = "123456";

    // Normalize / trim phone number
    const phoneToSearch = String(phoneNumber).trim();

    // Build queries: exact, and with '+' prefix if not already present
    const queries = [
      query(collection(db, "users"), where("phoneNumber", "==", phoneToSearch)),
    ];

    if (!phoneToSearch.startsWith("+")) {
      queries.push(
        query(
          collection(db, "users"),
          where("phoneNumber", "==", "+" + phoneToSearch)
        )
      );
    }

    // Try each query until we find a user
    let userDoc: unknown = null;
    for (const q of queries) {
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        userDoc = { id: doc.id, ...doc.data() };
        break;
      }
    }

    if (!userDoc) {
      return NextResponse.json(
        { error: "User not found with this phone number" },
        { status: 404 }
      );
    }

    // Assert userDoc type for correct property access
    const { id: uid } = userDoc as { id: string };

    if (!adminAuth) {
      return NextResponse.json(
        { error: "Admin authentication not initialized" },
        { status: 500 }
      );
    }

    // Update the user's password using Firebase Admin SDK
    await adminAuth.updateUser(uid, {
      password: newPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully to 123456",
      // Type assertion to fix lint error
      phoneNumber: (userDoc as { phoneNumber?: string }).phoneNumber ?? phoneToSearch,
      uid,
    });
  } catch (error) {
    console.error("Password reset error:", error);

    // Handle specific Firebase errors
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "auth/user-not-found"
    ) {
      return NextResponse.json(
        { error: "User not found in authentication system" },
        { status: 404 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "auth/invalid-password"
    ) {
      return NextResponse.json(
        { error: "Invalid password format" },
        { status: 400 }
      );
    }
    }

    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
}