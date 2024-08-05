// Import necessary modules from mongoose and nestjs
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class Roles {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Object })
  permissions: Record<string, any>;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Organization",
    default: null,
  })
  organization?: MongooseSchema.Types.ObjectId | null;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;
}

export type RolesDocument = Roles & Document;

export const RolesSchema = SchemaFactory.createForClass(Roles);
