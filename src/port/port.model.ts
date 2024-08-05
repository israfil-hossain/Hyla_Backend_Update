import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Port {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  long: number;

  @Prop({ required: true })
  UNLOCODE: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  created_by?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  updated_by?: Types.ObjectId | null;
}

export type PortDocument = Port & Document;

export const PortSchema = SchemaFactory.createForClass(Port);
