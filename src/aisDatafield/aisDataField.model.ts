import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class AisDataField {
  @Prop({ required: true })
  fieldName: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: false })
  fromAIS: boolean;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;
}

export type AisDataFieldDocument = AisDataField & Document;

export const AisDataFieldSchema = SchemaFactory.createForClass(AisDataField);
