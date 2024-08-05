// bucket.module.ts

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import {
  Organization,
  OrganizationSchema,
} from "src/organization/organization.model";
import { OrganizationModule } from "src/organization/organization.module";
import { OrganizationService } from "src/organization/organization.service";
import { TrackableTransportModule } from "src/Trackable_Transport/trackable_transport.module";
import { User, UserSchema } from "src/user/user.model";
import { Voyage, VoyageSchema } from "src/voyage/voyage.model";
import { Roles, RolesSchema } from "../roles/roles.model";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "../Trackable_Transport/trackable_transport.model";
import { BucketController } from "./bucket.controller";
import { Bucket, BucketSchema } from "./bucket.model";
import { BucketService } from "./bucket.service";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bucket.name, schema: BucketSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
      { name: User.name, schema: UserSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Voyage.name, schema: VoyageSchema },
    ]),
    ConfigModule.forRoot(),
    TrackableTransportModule,
    OrganizationModule,
  ],
  controllers: [BucketController],
  providers: [BucketService, OrganizationService, MailerService],
  exports: [BucketService],
})
export class BucketModule {}
