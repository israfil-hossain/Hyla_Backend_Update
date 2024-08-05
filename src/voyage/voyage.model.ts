import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
enum Status {
  onGoing = "onGoing",
  complete = "complete",
}
@Schema({ timestamps: true })
export class Voyage {
  @Prop({ default: "" })
  name: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Port",
    default: null,
  })
  port?: MongooseSchema.Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "TrackableTransport",
    default: null,
  })
  transport?: MongooseSchema.Types.ObjectId | null;

  @Prop({ required: true })
  ETB: string;

  @Prop({ required: true })
  BerthName: string;

  @Prop()
  ATB: Date;

  @Prop()
  A_Berth: string;

  @Prop({ enum: Status })
  status: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Organization",
    default: null,
  })
  orgId?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;
}

export type VoyageDocument = Voyage & Document;

export const VoyageSchema = SchemaFactory.createForClass(Voyage);
