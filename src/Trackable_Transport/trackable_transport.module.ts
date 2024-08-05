// trackable-transport.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TrackableTransportController } from "./trackable_transport.controllers";
import { TrackableTransportService } from "./trackable_transport.service";
import {
  TrackableTransport,
  TrackableTransportSchema,
} from "./trackable_transport.model";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrackableTransport.name, schema: TrackableTransportSchema },
    ]),
  ],
  controllers: [TrackableTransportController],
  providers: [TrackableTransportService],
})
export class TrackableTransportModule {}
