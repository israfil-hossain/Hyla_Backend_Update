import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";
import { NotificationController } from "./notification.controller";
import { Notification, NotificationSchema } from "./notification.model";
import { NotificationService } from "./notification.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MailerService],
})
export class NotificationModule {}
