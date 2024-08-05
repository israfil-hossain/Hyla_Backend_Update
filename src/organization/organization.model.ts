// organization.model.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  ownerName: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  owner_id?: MongooseSchema.Types.ObjectId | null;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: "TrackableTransport" }],
    default: null,
  })
  transports: MongooseSchema.Types.ObjectId[];

  @Prop()
  image: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;
}

export type OrganizationDocument = Organization & Document;

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
