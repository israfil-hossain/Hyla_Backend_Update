import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AlertController } from "./alert.controller";
import { AlertService } from "./alert.service";
import { Alert, AlertSchema } from "./alert.model";
import { ConfigModule } from "@nestjs/config";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: User.name, schema: UserSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [AlertController],
  providers: [AlertService, MailerService, FirebaseService],
})
export class AlertModule {}
