import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { User, UserSchema } from "./user.model";
import {
  Organization,
  OrganizationSchema,
} from "../organization/organization.model";
import { Roles, RolesSchema } from "src/roles/roles.model";
import { MailerService } from "src/mail/mailer.service";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { Geofence, GeofenceSchema } from "src/geoFence/geofence.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Geofence.name, schema: GeofenceSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [UserController],
  providers: [UserService, MailerService, FirebaseService],
})
export class UserModule {}
