// geoFence.module.ts
import { Module } from "@nestjs/common";
import { GeoFencesAlertService } from "./geofencesAlert.service";
import { User, UserSchema } from "./user/user.model";
import { Alert, AlertSchema } from "./alert/alert.model";
import { MailerService } from "./mail/mailer.service";
import { Geofence, GeofenceSchema } from "./geoFence/geofence.model";
import { MongooseModule } from "@nestjs/mongoose/dist/mongoose.module";
import { Bucket, BucketSchema } from "./bucket/bucket.model";
import {
  Organization,
  OrganizationSchema,
} from "./organization/organization.model";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "./Trackable_Transport/trackable_transport.model";
import { OrganizationModule } from "./organization/organization.module";
import { OrganizationService } from "./organization/organization.service";
import {
  Notification,
  NotificationSchema,
} from "./notification/notification.model";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bucket.name, schema: BucketSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
      { name: User.name, schema: UserSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: Geofence.name, schema: GeofenceSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [GeoFencesAlertService, MailerService],
})
export class GeoFenceAlertModule {}
