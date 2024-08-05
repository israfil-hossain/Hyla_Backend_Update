import { Module } from "@nestjs/common";
// import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { AisDataFiledModule } from "./aisDatafield/aisDataField.modules";
import { Alert, AlertSchema } from "./alert/alert.model";
import { AlertModule } from "./alert/alert.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthenticationModule } from "./authentication/authentication.module";
import { AuthenticationGuardProvider } from "./authentication/guard/authentication.guard";
import { Bucket, BucketSchema } from "./bucket/bucket.model";
import { BucketModule } from "./bucket/bucket.module";
import { BucketService } from "./bucket/bucket.service";
import { jwtConfig } from "./config/jwt.config";
import { EncryptionModule } from "./encryption/encryption.module";
import { Geofence, GeofenceSchema } from "./geoFence/geofence.model";
import { GeofenceModule } from "./geoFence/geofence.modules";
import { GeofenceService } from "./geoFence/geofence.service";
import { GeoFenceAlertModule } from "./geofenceAlert.module";
import { MailerService } from "./mail/mailer.service";
import {
  Notification,
  NotificationSchema,
} from "./notification/notification.model";
import { NotificationModule } from "./notification/notification.module";
import {
  Organization,
  OrganizationSchema,
} from "./organization/organization.model";
import { OrganizationModule } from "./organization/organization.module";
import { PortModule } from "./port/port.modules";
import { RolesModule } from "./roles/roles.modules";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "./Trackable_Transport/trackable_transport.model";
import { TrackableTransportModule } from "./Trackable_Transport/trackable_transport.module";
import { User, UserSchema } from "./user/user.model";
import { UserModule } from "./user/user.module";
import { VoyageModule } from "./voyage/voyage.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
    }),
    JwtModule.registerAsync(jwtConfig),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        // uri: process.env.MONGO_URL_DEV, // dev
        // uri: process.env.MONGO_URL_PROD, // prod
        uri: process.env.MONGO_URL_LOCAL, // local
        // user: process.env.MONGO_USER,
        // pass: process.env.MONGO_PASSWORD,
        // user: null,
        // pass: null,
      }),
    }),
    MongooseModule.forFeature([
      { name: Bucket.name, schema: BucketSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
      { name: User.name, schema: UserSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: Geofence.name, schema: GeofenceSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),

    AuthenticationModule,
    UserModule,
    OrganizationModule,
    RolesModule,
    TrackableTransportModule,
    BucketModule,
    AlertModule,
    AisDataFiledModule,
    GeofenceModule,
    GeoFenceAlertModule,
    PortModule,
    VoyageModule,
    NotificationModule,
    EncryptionModule,
  ],
  controllers: [AppController],
  providers: [
    AuthenticationGuardProvider,
    AppService,
    MailerService,
    BucketService,
    GeofenceService,
  ],
})
export class AppModule {}

// export class AppModule implements OnModuleInit {
//   constructor() {}

//   async onModuleInit() {
//     try {
//       MongooseModule.forRoot(
//         // process.env.MONGO_URL_DEV,
//         process.env.MONGO_URL_PROD,
//       );

//       console.log("Database connection successful");
//     } catch (error) {
//       console.error("Database connection failed", error.message);
//     }
//   }
// }

// this is my new commet
