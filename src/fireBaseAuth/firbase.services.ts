import { Injectable, Inject } from "@nestjs/common";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseService {
  constructor(
    @Inject("FIREBASE_ADMIN") private readonly firebaseAdmin: admin.app.App,
  ) {}

  async createUser(email: string, password: string): Promise<string> {
    try {
      const userRecord = await this.firebaseAdmin.auth().createUser({
        email,
        password,
      });
      return userRecord.uid;
    } catch (error) {
      // Improved error handling
      console.error("Error creating user:", error.message);
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already exists. Please choose a different one.");
      } else {
        throw error; // Re-throw other errors for upstream handling
      }
    }
  }
}
