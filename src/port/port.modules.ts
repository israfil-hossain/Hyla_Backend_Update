import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";
import { Port, PortSchema } from "./port.model";
import { PortService } from "./port.service";
import { PortController } from "./port.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Port.name, schema: PortSchema },
      { name: User.name, schema: UserSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [PortController],
  providers: [PortService, MailerService, FirebaseService],
})
export class PortModule {}
