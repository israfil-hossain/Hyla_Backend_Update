// organization.module.ts

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Bucket, BucketSchema } from "src/bucket/bucket.model";
import { MailerService } from "src/mail/mailer.service";
import { Roles, RolesSchema } from "src/roles/roles.model";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "src/Trackable_Transport/trackable_transport.model";
import { Voyage, VoyageSchema } from "src/voyage/voyage.model";
import { User, UserSchema } from "../user/user.model";
import { OrganizationController } from "./organization.controller";
import { Organization, OrganizationSchema } from "./organization.model";
import { OrganizationService } from "./organization.service";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Bucket.name, schema: BucketSchema },
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
      { name: Voyage.name, schema: VoyageSchema },
    ]),
  ],
  providers: [OrganizationService, MailerService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
