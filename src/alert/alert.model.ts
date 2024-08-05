import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Array, required: true })
  criteria: any[];

  @Prop({ required: true })
  alertOnEmail: boolean;

  @Prop({ required: true })
  alertOnNotification: boolean;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;
}

export type AlertDocument = Alert & Document;

export const AlertSchema = SchemaFactory.createForClass(Alert);
