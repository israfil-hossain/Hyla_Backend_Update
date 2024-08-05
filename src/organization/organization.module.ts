// organization.module.ts

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Organization, OrganizationSchema } from "./organization.model";
import { OrganizationService } from "./organization.service";
import { OrganizationController } from "./organization.controller";
import { User, UserSchema } from "../user/user.model";
import { MailerService } from "src/mail/mailer.service";
import { Roles, RolesSchema } from "src/roles/roles.model";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "src/Trackable_Transport/trackable_transport.model";
import { Bucket, BucketSchema } from "src/bucket/bucket.model";
import { BucketModule } from "src/bucket/bucket.module";
import { BucketService } from "src/bucket/bucket.service";
import { Voyage, VoyageSchema } from "src/voyage/voyage.model";
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
    FirebaseModule,
  ],
  providers: [OrganizationService, MailerService, FirebaseService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
