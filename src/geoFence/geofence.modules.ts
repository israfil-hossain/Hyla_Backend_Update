import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GeofenceController } from "./geofence.controller";
import { GeofenceService } from "./geofence.service";
import { Geofence, GeofenceSchema } from "./geofence.model";
import { MailerService } from "src/mail/mailer.service";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { User, UserSchema } from "src/user/user.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Geofence.name,
        schema: GeofenceSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [GeofenceController],
  providers: [GeofenceService, MailerService, FirebaseService],
})
export class GeofenceModule {}
