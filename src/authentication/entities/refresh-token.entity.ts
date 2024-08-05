import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model, Types } from "mongoose";
import { User } from "src/user/user.model";

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export type RefreshTokenType = Model<RefreshTokenDocument>;

@Schema({
  toJSON: {
    transform: function (_, ret) {
      delete ret?.token;
    },
  },
})
export class RefreshToken {
  @Prop({ type: String, required: true, unique: true })
  token: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  tokenUser: Types.ObjectId;

  @Prop({
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
  expiresAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
