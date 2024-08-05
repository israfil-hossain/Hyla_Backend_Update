import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { MailerService } from "src/mail/mailer.service";
import { User, UserSchema } from "src/user/user.model";
import { Voyage, VoyageSchema } from "./voyage.model";
import { Port, PortSchema } from "src/port/port.model";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "src/Trackable_Transport/trackable_transport.model";
import { VoyageController } from "./voyage.controller";
import { VoyageService } from "./voyage.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voyage.name, schema: VoyageSchema },
      { name: User.name, schema: UserSchema },
      { name: Port.name, schema: PortSchema },
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [VoyageController],
  providers: [VoyageService, MailerService, FirebaseService],
})
export class VoyageModule {}
