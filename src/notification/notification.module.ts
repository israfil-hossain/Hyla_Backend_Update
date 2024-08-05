import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { User, UserSchema } from "src/user/user.model";
import { Notification, NotificationSchema } from "./notification.model";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MailerService, FirebaseService],
})
export class NotificationModule {}
