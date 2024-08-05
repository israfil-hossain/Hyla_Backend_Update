// bucket.service.ts

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Schema, Types } from "mongoose";
import { Bucket, BucketDocument } from "./bucket.model";
import { OrganizationService } from "../organization/organization.service";
import { faker } from "@faker-js/faker";
import axios from "axios";
import {
  Organization,
  OrganizationDocument,
} from "src/organization/organization.model";
import {
  TrackableTransport,
  TrackableTransportDocument,
} from "../Trackable_Transport/trackable_transport.model";

@Injectable()
export class BucketService {
  [x: string]: any;
  constructor(
    @InjectModel(Bucket.name)
    private readonly bucketModel: Model<BucketDocument>,
    private readonly organizationService: OrganizationService,
    @InjectModel(TrackableTransport.name)
    private trackableTransportModel: Model<TrackableTransportDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async getDistance(
    long1: any,
    lat1: any,
    long2: any,
    lat2: any,
  ): Promise<any> {
    const apiUrl = `${process.env.VT_URL}distance?userkey=${process.env.VT_USER_KEY}&from=${long1},${lat1}&to=${long2},${lat2}`;

    try {
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error.message);
      throw new Error("Failed to fetch data");
    }
  }

  async fetchDataFromAIS_3(imo: number, sat: boolean): Promise<any> {
    const satNumber = sat === true ? 1 : 0;
    const apiUrl = `${process.env.VT_URL}vessels?userkey=${process.env.VT_USER_KEY}&imo=${imo}&sat=${satNumber}`; // ENV
    try {
      const response = await axios.get(apiUrl);

      if (response.status === 200) {
        return response.data;
      } else {
        console.error("data:", response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error fetching data:", error.response);
      } else {
        console.error("Error fetching data:", error.message);
      }
    }
  }

  async fetchDataFromAIS(imo: any): Promise<any> {
    const apiUrl = `${process.env.VT_URL}vessels?userkey=${process.env.VT_USER_KEY}&imo=${imo}&sat=1`; // ENV
    try {
      const response = await axios.get(apiUrl);

      if (response.status === 200) {
        return response.data;
      } else {
        console.error("data:", response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error fetching data:", error.response);
      } else {
        console.error("Error fetching data:", error.message);
      }
    }
  }

  async fetchDataAndSaveToBucket(src: string, sat: boolean): Promise<any> {
    try {
      const organizations = await this.organizationService.getAll();

      if (!organizations || organizations.length === 0) {
        throw new Error("No organizations found");
      }

      const fetchFunction =
        src === "faker" ? this.generateFakeAISData : this.fetchDataFromAIS_3;

      let transports = organizations.flatMap((org) =>
        org.transports.map((t) => t.toString()),
      );
      transports = [...new Set(transports)];

      if (!transports || transports.length === 0) {
        console.warn("No transports found");
        return;
      }

      await Promise.all(
        transports.map(async (transportId) => {
          const transportData = await this.trackableTransportModel
            .findById(transportId)
            .lean();

          if (!transportData) {
            console.error(`Transport with ID ${transportId} not found.`);
            return;
          }

          let newAISArray;
          const aisData = await fetchFunction(transportData.imoNumber, sat);

          if (src === "faker") {
            newAISArray = Array.isArray(aisData) ? aisData : [aisData];
          } else {
            newAISArray = aisData.map((item: any) => ({
              MMSI: item.AIS.MMSI,
              TIMESTAMP: item.AIS.TIMESTAMP,
              LATITUDE: item.AIS.LATITUDE,
              LONGITUDE: item.AIS.LONGITUDE,
              COURSE: item.AIS.COURSE,
              SPEED: item.AIS.SPEED,
              HEADING: item.AIS.HEADING,
              NAVSTAT: item.AIS.NAVSTAT,
              IMO: item.AIS.IMO,
              NAME: item.AIS.NAME,
              CALLSIGN: item.AIS.CALLSIGN,
              TYPE: item.AIS.TYPE,
              A: item.AIS.A,
              B: item.AIS.B,
              C: item.AIS.C,
              D: item.AIS.D,
              DRAUGHT: item.AIS.DRAUGHT,
              DESTINATION: item.AIS.DESTINATION,
              LOCODE: item.AIS.LOCODE,
              ETA_AIS: item.AIS.ETA_AIS,
              ETA: item.AIS.ETA,
              SRC: item.AIS.SRC,
              ZONE: item.AIS.ZONE,
              ECA: item.AIS.ECA,
              DISTANCE_REMAINING: item.AIS.DISTANCE_REMAINING,
              ETA_PREDICTED: item.AIS.ETA_PREDICTED,
            }));
          }

          const currentTime = new Date();
          const existingBucket = await this.bucketModel.findOne({
            transport_id: new mongoose.Types.ObjectId(transportId),
            start_date: { $lt: currentTime },
            end_date: { $gte: currentTime },
          });

          if (existingBucket) {
            existingBucket.AISDataObject = [
              ...existingBucket.AISDataObject,
              ...newAISArray,
            ];

            existingBucket.total_entries = existingBucket.AISDataObject.length;

            return await existingBucket.save();
          } else {
            const startTimeStamp = Date.now();
            const endTimeStamp =
              startTimeStamp + parseInt(process.env.BucketTime) * 60 * 1000;
            const bucketData: Partial<Bucket> = {
              transport_id: new Types.ObjectId(
                transportId,
              ) as unknown as Schema.Types.ObjectId,
              start_date: new Date(startTimeStamp),
              end_date: new Date(endTimeStamp),
              AISDataObject: newAISArray,
              total_entries: newAISArray.length,
            };

            const createdBucket = new this.bucketModel(bucketData);
            return await createdBucket.save();
          }
        }),
      );
    } catch (error) {
      console.log(sat ? "SAT" : "TER");
      console.error("Error in fetchDataAndSaveToBucket:", error.message);
    }
  }

  private async generateFakeAISData(imo: number, sat: boolean): Promise<any> {
    return Promise.resolve({
      MMSI: faker.number.int(),
      TIMESTAMP: new Date().toISOString(),
      LATITUDE: faker.location.latitude(),
      LONGITUDE: faker.location.longitude(),
      COURSE: faker.number.int({ min: 0, max: 360 }),
      SPEED: faker.number.float({ min: 0, max: 20, precision: 1 }),
      HEADING: faker.number.int({ min: 0, max: 360 }),
      NAVSTAT: faker.number.int(),
      IMO: imo,
      NAME: faker.person.fullName(),
      CALLSIGN: faker.string.alphanumeric(),
      TYPE: faker.number.int(),
      A: faker.number.int(),
      B: faker.number.int(),
      C: faker.number.int(),
      D: faker.number.int(),
      DRAUGHT: faker.number.float({ min: 0, max: 15, precision: 1 }),
      DESTINATION: faker.location.city(),
      LOCODE: faker.location.countryCode(),
      ETA_AIS: faker.date.future().toISOString(),
      ETA: faker.date.future().toISOString(),
      SRC: sat === true ? "SAT" : "TER",
      ZONE: faker.location.county(),
      ECA: faker.datatype.boolean(),
      DISTANCE_REMAINING: faker.number.int({ min: 0, max: 1000 }),
      ETA_PREDICTED: faker.date.future().toISOString(),
    });
  }

  async getLatestAISDataByTransportId(transportId: string): Promise<any> {
    const currentTime = new Date();
    const bucket = await this.bucketModel
      .findOne({
        transport_id: transportId,
        start_date: { $lt: currentTime },
        end_date: { $gte: currentTime },
      })
      .populate("transport_id")
      .exec();

    if (!bucket || !bucket.AISDataObject || bucket.AISDataObject.length === 0) {
      throw new Error("No AIS data found for the specified transportId");
    }

    const latestAISData = bucket.AISDataObject.reduce((latest, current) =>
      new Date(current.TIMESTAMP) > new Date(latest.TIMESTAMP)
        ? current
        : latest,
    );

    return {
      ...latestAISData,
      transport_id: bucket.transport_id,
      customData: bucket.customData,
    };
  }

  // async getLatestAISDataByTransportId2(transportId: string): Promise<any> {
  //   let currentTime = new Date();
  //   const bucket = await this.bucketModel
  //     .findOne({
  //       transport_id: transportId,
  //       start_date: { $lt: currentTime },
  //       end_date: { $gte: currentTime },
  //     })
  //     .populate('transport_id')
  //     .exec();

  //   if (!bucket || !bucket.AISDataObject || bucket.AISDataObject.length === 0) {
  //     throw new Error('No AIS data found for the specified transportId');
  //   }

  // const latestAISData = bucket.AISDataObject.reduce((latest, current) =>
  //   new Date(current.TIMESTAMP) > new Date(latest.TIMESTAMP)
  //     ? current
  //     : latest,
  // );

  //   return { latestAISData: latestAISData, transport_id: bucket.transport_id, customData:bucket.customData };
  // }

  async getLatestAISDataByTransportId2(transportId: string): Promise<any> {
    const currentTime = new Date();
    const bucket = await this.bucketModel
      .findOne({
        transport_id: transportId,
        start_date: { $lt: currentTime },
        end_date: { $gte: currentTime },
      })
      .populate("transport_id")
      .exec();

    if (!bucket || !bucket.AISDataObject || bucket.AISDataObject.length === 0) {
      throw new Error("No AIS data found for the specified transportId");
    }

    bucket.AISDataObject.sort(
      (a, b) =>
        new Date(b.TIMESTAMP).getTime() - new Date(a.TIMESTAMP).getTime(),
    );

    return {
      AISDataObjects: bucket.AISDataObject,
      transport_id: bucket.transport_id,
      customData: bucket.customData,
    };
  }

  async GetFromAisDataVTAPI(transportId: string): Promise<any> {
    const transportData =
      await this.trackableTransportModel.findById(transportId);

    let updated: any[];

    try {
      updated = await this.fetchDataFromAIS(transportData.imoNumber);
    } catch (error) {
      console.error("Error fetching AIS data:", error);
      updated = [];
    }

    const mappedAISData = updated.map((item) => ({
      transportName: transportData.transportName,
      imoNumber: transportData.imoNumber,
      MMSI: item.AIS.MMSI,
      TIMESTAMP: item.AIS.TIMESTAMP,
      LATITUDE: item.AIS.LATITUDE,
      LONGITUDE: item.AIS.LONGITUDE,
      COURSE: item.AIS.COURSE,
      SPEED: item.AIS.SPEED,
      HEADING: item.AIS.HEADING,
      NAVSTAT: item.AIS.NAVSTAT,
      IMO: item.AIS.IMO,
      NAME: item.AIS.NAME,
      CALLSIGN: item.AIS.CALLSIGN,
      TYPE: item.AIS.TYPE,
      A: item.AIS.A,
      B: item.AIS.B,
      C: item.AIS.C,
      D: item.AIS.D,
      DRAUGHT: item.AIS.DRAUGHT,
      DESTINATION: item.AIS.DESTINATION,
      LOCODE: item.AIS.LOCODE,
      ETA_AIS: item.AIS.ETA_AIS,
      ETA: item.AIS.ETA,
      SRC: item.AIS.SRC,
      ZONE: item.AIS.ZONE,
      ECA: item.AIS.ECA,
      DISTANCE_REMAINING: item.AIS.DISTANCE_REMAINING,
      ETA_PREDICTED: item.AIS.ETA_PREDICTED,
    }));

    return mappedAISData[0];
  }

  async getAISDataByTransportIdTimeTendor(
    transportId: string,
    timeTenderedAt: any,
  ): Promise<any> {
    const currentTime = new Date();
    const bucket = await this.bucketModel
      .findOne({
        transport_id: transportId,
        start_date: { $lt: currentTime },
        end_date: { $gte: currentTime },
      })
      .populate("transport_id")
      .exec();

    if (!bucket || !bucket.AISDataObject || bucket.AISDataObject.length === 0) {
      throw new Error("No AIS data found for the specified transportId");
    }

    const latestAISData = bucket.AISDataObject.reduce((latest, current) =>
      new Date(current.TIMESTAMP) > new Date(latest.TIMESTAMP)
        ? current
        : latest,
    );

    // Convert timeTenderedAt to UTC format and extract the date portion
    const formattedTimeTenderedAt = new Date(timeTenderedAt)
      .toISOString()
      .split("T")[0];

    // console.log('formattedTimeTenderedAt:', formattedTimeTenderedAt);
    // console.log(
    //   'AISDataObject dates:',
    //   bucket.AISDataObject.map((data) => data.TIMESTAMP.split(' ')[0]),
    // );

    // Filter AISDataObject based on the date portion
    const filteredAISData = bucket.AISDataObject.filter(
      (data) => data.TIMESTAMP.split(" ")[0] === formattedTimeTenderedAt,
    );

    // console.log('Filtered AISDataObject:', filteredAISData);

    return {
      latestAISData: latestAISData,
      transport_id: bucket.transport_id,
      AISTimeTendorData: filteredAISData,
    };
  }

  async createCustomData(transportId: string, customData: any): Promise<any> {
    const currentTime = new Date();
    const bucket = await this.bucketModel.findOne({
      transport_id: transportId,
      start_date: { $lt: currentTime },
      end_date: { $gte: currentTime },
    });

    if (!bucket) {
      throw new HttpException(
        "Bucket not found for transport ID",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!bucket.customData) {
      bucket.customData = [];
    }

    customData.forEach((data) => {
      bucket.customData.push(data);
    });

    const dataUpdate = await bucket.save();

    if (!dataUpdate) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return dataUpdate;
  }
}
