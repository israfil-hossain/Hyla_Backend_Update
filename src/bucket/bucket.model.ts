// bucket.model.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema()
export class Bucket extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "TrackableTransport",
    default: null,
  })
  transport_id?: MongooseSchema.Types.ObjectId | null;

  @Prop()
  start_date: Date;

  @Prop()
  end_date: Date;

  @Prop()
  is_Active: boolean;

  @Prop()
  srcType: string;

  @Prop()
  AISDataObject: {
    MMSI: number;
    TIMESTAMP: string;
    LATITUDE: number;
    LONGITUDE: number;
    COURSE: number;
    SPEED: number;
    HEADING: number;
    NAVSTAT: number;
    IMO: number;
    NAME: string;
    CALLSIGN: string;
    TYPE: number;
    A: number;
    B: number;
    C: number;
    D: number;
    DRAUGHT: number;
    DESTINATION: string;
    LOCODE: string;
    ETA_AIS: string;
    ETA: string;
    SRC: string;
    ZONE: string;
    ECA: boolean;
    DISTANCE_REMAINING: number | null;
    ETA_PREDICTED: string | null;
  }[];

  @Prop([{ fieldName: String, value: String, timestamp: String }])
  customData: Array<{ fieldName: string; value: string; timestamp: string }>;

  @Prop()
  total_entries: number;
}

export type BucketDocument = Bucket & Document;

export const BucketSchema = SchemaFactory.createForClass(Bucket);
