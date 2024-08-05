import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Geofence, GeofenceSchema } from "src/geoFence/geofence.model";
import { MailerService } from "src/mail/mailer.service";
import { Roles, RolesSchema } from "src/roles/roles.model";
import {
  Organization,
  OrganizationSchema,
} from "../organization/organization.model";
import { UserController } from "./user.controller";
import { User, UserSchema } from "./user.model";
import { UserService } from "./user.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Geofence.name, schema: GeofenceSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, MailerService],
})
export class UserModule {}
