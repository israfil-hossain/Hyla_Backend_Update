import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({ timestamps: true })
export class Geofence {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Array, required: true })
  geometry: any[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: "Alert" }],
    default: null,
  })
  alerts: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: [
      {
        transportId: {
          type: MongooseSchema.Types.ObjectId,
          ref: "TrackableTransport",
        },
        alerts: [
          {
            alertId: {
              type: MongooseSchema.Types.ObjectId,
              ref: "Alert",
            },
            status: { type: Boolean, default: false },
          },
        ],
        isTrigger: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  transports: Array<{
    transportId: MongooseSchema.Types.ObjectId;
    isTrigger: boolean;
    alerts: Array<{
      alertId: MongooseSchema.Types.ObjectId;
      status: boolean;
    }>;
  }>;

  @Prop()
  region: string;

  @Prop()
  Validity_of_Geofence: string;

  @Prop({ default: false })
  activeForAll: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  alertOnEmail: boolean;

  @Prop()
  alertOnNotification: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;
}

export type GeofenceDocument = Geofence & Document;

export const GeofenceSchema = SchemaFactory.createForClass(Geofence);
