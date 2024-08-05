import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

enum TransportType {
  Vessel = "vessel",
  Truck = "truck",
}

@Schema({ timestamps: true })
export class TrackableTransport {
  @Prop({ default: TransportType.Vessel })
  transportType: TransportType;

  @Prop({ default: 0 })
  imoNumber: number;

  @Prop({ default: 0 })
  MMSI: number;

  @Prop({ default: 0 })
  transportNo: number;

  @Prop({ default: "" })
  transportName: string;

  @Prop({ default: "" })
  flagCode: string;

  @Prop({ default: "" })
  flagName: string;

  @Prop({ default: "" })
  StatCode5: string;

  @Prop()
  transportCategory: string;

  @Prop({ default: "" })
  transportSubCategory: string;

  @Prop({ default: "" })
  SpireTransportType: string;

  @Prop({ default: 0 })
  buildYear: number;

  @Prop({ default: 0 })
  GrossTonnage: number;

  @Prop({ default: 0 })
  deadWeight: number;

  @Prop({ default: 0 })
  LOA: number;

  @Prop({ default: 0 })
  Beam: number;

  @Prop({ default: 0 })
  MaxDraft: number;

  @Prop({ default: 0 })
  ME_kW_used: number;

  @Prop({ default: 0 })
  AE_kW_used: number;

  @Prop({ default: 0 })
  RPM_ME_used: number;

  @Prop({ default: "" })
  Enginetype_code: string;

  @Prop({ default: 0 })
  subst_nr_ME: number;

  @Prop({ default: "" })
  Stofnaam_ME: string;

  @Prop({ default: "" })
  Stofnaam_AE: string;

  @Prop({ default: 0 })
  subst_nr_AE: number;

  @Prop({ default: "" })
  Fuel_ME_code_sec: string;

  @Prop({ default: 0 })
  EF_ME: number;

  @Prop({ default: "" })
  Fuel_code_aux: string;

  @Prop({ default: 0 })
  EF_AE: number;

  @Prop({ default: 0 })
  EF_gr_prs_ME: number;

  @Prop({ default: 0 })
  EF_gr_prs_AE_SEA: number;

  @Prop({ default: 0 })
  EF_gr_prs_AE_BERTH: number;

  @Prop({ default: 0 })
  EF_gr_prs_BOILER_BERTH: number;

  @Prop({ default: 0 })
  EF_gr_prs_AE_MAN: number;

  @Prop({ default: 0 })
  EF_gr_prs_AE_ANCHOR: number;

  @Prop({ default: 0 })
  NO_OF_ENGINE_active: number;

  @Prop({ default: 0 })
  CEF_type: number;

  @Prop()
  Loadfactor_ds: number;

  @Prop({ default: 0 })
  Speed_used: number;

  @Prop({ default: 0 })
  CRS_min: number;

  @Prop({ default: 0 })
  CRS_max: number;

  @Prop({ default: 0 })
  Funnel_heigth: number;

  @Prop({ default: 0 })
  FO_consumption_factor: number;

  @Prop({ default: 0 })
  coxemissionFactor: number;

  @Prop({ default: 0 })
  soxEmissionFactor: number;

  @Prop([
    {
      speed: Number,
      loadFactor: Number,
      sofc: Number,
    },
  ])
  SOFC_map_array: {
    speed: number;
    loadFactor: number;
    sofc: number;
  }[];

  @Prop({ default: 0 })
  TEU: number;

  @Prop({ default: 0 })
  CRUDE: number;

  @Prop({ default: 0 })
  GAS: number;

  @Prop({ default: "" })
  BUILDER: string;

  @Prop({ default: "" })
  MANAGER: string;

  @Prop({ default: "" })
  OWNER: string;

  @Prop({ default: "" })
  CLASS: string;

  @Prop({ default: 0 })
  Engine_tier: number;

  @Prop({ default: 0 })
  NOx_g_kwh: number;

  @Prop({ default: 0 })
  summer_dwt: number;
}

export type TrackableTransportDocument = TrackableTransport & Document;

export const TrackableTransportSchema =
  SchemaFactory.createForClass(TrackableTransport);
