import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";
import { AlertController } from "./alert.controller";
import { Alert, AlertSchema } from "./alert.model";
import { AlertService } from "./alert.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AlertController],
  providers: [AlertService, MailerService],
})
export class AlertModule {}
