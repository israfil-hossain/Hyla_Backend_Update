import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerService } from "src/mail/mailer.service";
import { AisDataField, AisDataFieldSchema } from "./aisDataField.model";
import { AisDataFiledController } from "./aisDatafield.controller";
import { AisDataFiledService } from "./aisDatafield.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AisDataField.name, schema: AisDataFieldSchema },
    ]),
  ],
  controllers: [AisDataFiledController],
  providers: [MailerService, AisDataFiledService],
})
export class AisDataFiledModule {}
