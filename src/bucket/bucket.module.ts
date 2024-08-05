// bucket.module.ts

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Bucket, BucketSchema } from "./bucket.model";
import {
  Organization,
  OrganizationSchema,
} from "src/organization/organization.model";
import { BucketService } from "./bucket.service";
import { OrganizationService } from "src/organization/organization.service";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "../Trackable_Transport/trackable_transport.model";
import { BucketController } from "./bucket.controller";
import { UserModule } from "src/user/user.module";
import { User, UserSchema } from "src/user/user.model";
import { Roles, RolesSchema } from "../roles/roles.model";
import { MailerService } from "src/mail/mailer.service";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { ConfigModule } from "@nestjs/config";
import { OrganizationModule } from "src/organization/organization.module";
import { TrackableTransportModule } from "src/Trackable_Transport/trackable_transport.module";
import { Voyage, VoyageSchema } from "src/voyage/voyage.model";
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
    FirebaseModule,
    ConfigModule.forRoot(),
    TrackableTransportModule,
    OrganizationModule,
  ],
  controllers: [BucketController],
  providers: [
    BucketService,
    OrganizationService,
    MailerService,
    FirebaseService,
  ],
  exports: [BucketService],
})
export class BucketModule {}
