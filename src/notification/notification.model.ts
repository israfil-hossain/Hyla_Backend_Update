import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title: string;

  @Prop()
  transportName: string;

  @Prop()
  imoNumber: string;

  @Prop()
  message: string;

  @Prop()
  type: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  userId?: MongooseSchema.Types.ObjectId | null;

  @Prop()
  isRead: boolean;
}

export type NotificationDocument = Notification & Document;

export const NotificationSchema = SchemaFactory.createForClass(Notification);
