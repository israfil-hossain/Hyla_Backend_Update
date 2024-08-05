import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { Roles } from "src/roles/roles.model";

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  idp_id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: "firebase" })
  idp_provider: string;

  @Prop()
  fcm_token: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: "Roles" }],
    default: null,
  })
  roles?: Roles[];

  @Prop({ type: Object, default: {} })
  permissions: Record<string, any>;

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
        geofences: [
          {
            geoId: {
              type: MongooseSchema.Types.ObjectId,
              ref: "Geofence",
            },
            isEnter: { type: Boolean, default: false },
            geoAlerts: [
              {
                alertId: {
                  type: MongooseSchema.Types.ObjectId,
                  ref: "Alert",
                  default: null,
                },
                status: { type: Boolean, default: false },
              },
            ],
          },
        ],
        isSelected: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  toi: Array<{
    transportId: MongooseSchema.Types.ObjectId;
    isSelected: boolean;
    alerts: Array<{
      alertId: MongooseSchema.Types.ObjectId;
      status: boolean;
    }>;
    geofences: Array<{
      geoId: MongooseSchema.Types.ObjectId;
      isEnter: boolean;
      geoAlerts: Array<{
        alertId: MongooseSchema.Types.ObjectId;
        status: boolean;
      }>;
    }>;
  }>;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Organization",
    default: null,
  })
  organization?: MongooseSchema.Types.ObjectId | null;

  @Prop({ default: false })
  isSuperUser: boolean;

  @Prop({ default: false })
  isOrganizationOwner: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  created_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  updated_by?: MongooseSchema.Types.ObjectId | null;

  @Prop({ type: [String], default: [] })
  hiddenColumns: string[];

  @Prop({ type: [String], default: [] })
  visibleColumnsOrder: string[];
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
