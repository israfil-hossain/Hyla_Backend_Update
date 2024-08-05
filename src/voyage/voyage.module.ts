import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { Port, PortSchema } from "src/port/port.model";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "src/Trackable_Transport/trackable_transport.model";
import { User, UserSchema } from "src/user/user.model";
import { VoyageController } from "./voyage.controller";
import { Voyage, VoyageSchema } from "./voyage.model";
import { VoyageService } from "./voyage.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voyage.name, schema: VoyageSchema },
      { name: User.name, schema: UserSchema },
      { name: Port.name, schema: PortSchema },
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
    ]),
  ],
  controllers: [VoyageController],
  providers: [VoyageService, MailerService],
})
export class VoyageModule {}
