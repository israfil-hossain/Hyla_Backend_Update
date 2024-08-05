import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";
import { PortController } from "./port.controller";
import { Port, PortSchema } from "./port.model";
import { PortService } from "./port.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Port.name, schema: PortSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PortController],
  providers: [PortService, MailerService],
})
export class PortModule {}
