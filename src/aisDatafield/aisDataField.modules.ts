import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { FirebaseModule } from "src/fireBaseAuth/firebase.module";
import { FirebaseService } from "src/fireBaseAuth/firbase.services";
import { MailerService } from "src/mail/mailer.service";
import { AisDataField, AisDataFieldSchema } from "./aisDataField.model";
import { AisDataFiledController } from "./aisDatafield.controller";
import { AisDataFiledService } from "./aisDatafield.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AisDataField.name, schema: AisDataFieldSchema },
    ]),
    FirebaseModule,
  ],
  controllers: [AisDataFiledController],
  providers: [MailerService, FirebaseService, AisDataFiledService],
})
export class AisDataFiledModule {}
