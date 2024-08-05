import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";
import { GeofenceController } from "./geofence.controller";
import { Geofence, GeofenceSchema } from "./geofence.model";
import { GeofenceService } from "./geofence.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Geofence.name,
        schema: GeofenceSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GeofenceController],
  providers: [GeofenceService, MailerService],
})
export class GeofenceModule {}
