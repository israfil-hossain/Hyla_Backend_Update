import { Module } from "@nestjs/common";
import * as admin from "firebase-admin";
import { FirebaseController } from "./firebase.controller";

import * as dotenv from "dotenv";
import { FirebaseService } from "./firbase.services";

dotenv.config();

interface ServiceAccount {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

// Production
const serviceAccountKey: ServiceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_CERT,
  client_x509_cert_url: process.env.CLIENT_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccountKey as admin.ServiceAccount),
};

admin.initializeApp(firebaseConfig);

@Module({
  providers: [
    {
      provide: "FIREBASE_ADMIN",
      useValue: admin,
    },
    FirebaseService,
  ],
  controllers: [FirebaseController],
  exports: ["FIREBASE_ADMIN"],
})
export class FirebaseModule {}
