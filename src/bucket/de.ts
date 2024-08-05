// bucket.service.ts

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { Bucket, BucketDocument } from "./bucket.model";
import { OrganizationService } from "../organization/organization.service";
import { faker } from "@faker-js/faker";
import axios from "axios";
import * as moment from "moment";
import { Schema } from "mongoose";
import { ObjectId } from "mongoose";
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

  async fetchDataFromAIS(imo: number, sat: boolean): Promise<any> {
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

  async fetchDataFromAIS_2(imo: any): Promise<any> {
    const apiUrl = `${process.env.VT_URL}vessels?userkey=${process.env.VT_USER_KEY}&imo=${imo}&sat=0`; // ENV
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

  // async fetchDataAndSaveToBucket(src: string, sat: boolean): Promise<any> {

  //   const organizations = await this.organizationService.getAll();

  //   let func = null;

  //   if (src === 'faker') {
  //     func = this.generateFakeAISData;
  //   } else {
  //     func = this.fetchDataFromAIS;
  //   }

  //   if (!organizations || organizations.length === 0) {
  //     throw new Error('No organizations found');
  //   }

  //   let transports = [];

  //   for (const organization of organizations) {
  //     transports.push(...organization.transports);
  //   }

  //   transports = transports.map((t) => {
  //     return t.toString();
  //   });
  //   transports = [...new Set(transports)];

  //   if (!transports || transports.length === 0) {
  //     console.warn(
  //       `No transports found `,
  //     );
  //     return;
  //   }

  //   transports.forEach(async (transportId) => {
  // let currentTime = new Date();

  //     const transportData =
  //       await this.trackableTransportModel.findById(transportId);

  //     const aisData = await func(transportData.imoNumber, sat);
  //     const newAISArray = Array.isArray(aisData) ? aisData : [aisData];

  //     const existingBucket = await this.bucketModel.findOne({
  //       transport_id: new mongoose.Types.ObjectId(transportId),
  //       start_date: { $lt: currentTime },
  //       end_date: { $gte: currentTime },
  //     });

  //     if (existingBucket) {

  //       existingBucket.AISDataObject = [
  //         ...existingBucket.AISDataObject,
  //         ...newAISArray,
  //       ];

  //       existingBucket.total_entries = existingBucket.AISDataObject.length;

  //       await existingBucket.save();
  //       return existingBucket;
  //     } else {
  //       let startTimeStamp = Date.now();
  //       const bucketData: Partial<Bucket> = {
  //         transport_id: transportId,
  // start_date: new Date(startTimeStamp),
  // end_date: new Date(
  //   startTimeStamp + parseInt(process.env.BucketTime) * 60 * 1000,
  // ), // in-min
  //         AISDataObject: newAISArray,
  //         total_entries: newAISArray.length,
  //       };

  //       const createdBucket = new this.bucketModel(bucketData);
  //       await createdBucket.save();
  //       return createdBucket;
  //     }
  //   });

  // }

  async fetchDataAndSaveToBucket(src: string, sat: boolean): Promise<any> {
    try {
      const organizations = await this.organizationService.getAll();

      if (!organizations || organizations.length === 0) {
        throw new Error("No organizations found");
      }

      const fetchFunction =
        src === "faker" ? this.generateFakeAISData : this.fetchDataFromAIS;

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
          const currentTime = new Date();

          const transportData = await this.trackableTransportModel
            .findById(transportId)
            .lean();

          if (!transportData) {
            console.error(`Transport with ID ${transportId} not found.`);
            return;
          }

          const aisData = await fetchFunction(transportData.imoNumber, sat);
          const newAISArray = Array.isArray(aisData) ? aisData : [aisData];

          // Calculate the bucket start and end dates based on the current time
          const startTimeStamp =
            Math.floor(currentTime.getTime() / (2 * 60 * 1000)) *
            (2 * 60 * 1000);
          const endTimeStamp = startTimeStamp + 2 * 60 * 1000;

          const existingBucket = await this.bucketModel.findOne({
            transport_id: new mongoose.Types.ObjectId(transportId),
            start_date: { $lt: endTimeStamp },
            end_date: { $gte: startTimeStamp },
          });

          if (existingBucket) {
            existingBucket.AISDataObject = [
              ...existingBucket.AISDataObject,
              ...newAISArray,
            ];

            existingBucket.total_entries = existingBucket.AISDataObject.length;

            await existingBucket.save();
          } else {
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
            await createdBucket.save();
          }
        }),
      );
    } catch (error) {
      console.error("Error in fetchDataAndSaveToBucket:", error);
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
    const bucket = await this.bucketModel
      .findOne({ transport_id: transportId })
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

    return { ...latestAISData, transport_id: bucket.transport_id };
  }

  // async createDataFromVTAPi(): Promise<any> {
  //   const organizations = await this.organizationService.getAll();

  //   if (!organizations || organizations.length === 0) {
  //     throw new Error('No organizations found');
  //   }

  //   const VTBucketData = [];

  //   for (const organization of organizations) {
  //     const transports = organization.transports;

  //     if (!transports || transports.length === 0) {
  //       console.warn(
  //         `No transports found for organization ${organization.name}`,
  //       );
  //       continue;
  //     }

  //     for (const transportId of transports) {
  //       const transportData =
  //         await this.trackableTransportModel.findById(transportId);

  //       const existingBucket = await this.bucketModel.findOne({
  //         transport_id: transportId,
  //         // start_date less than current time
  //         // end_date greater than current time
  //       });

  //       let updated: any[];

  //       try {
  //         updated = await this.fetchDataFromAIS(transportData.imoNumber);
  //       } catch (error) {
  //         console.error('Error fetching AIS data:', error);
  //         updated = [];
  //       }

  //       const mappedAISData = updated.map((item) => ({
  //         MMSI: item.AIS.MMSI,
  //         TIMESTAMP: item.AIS.TIMESTAMP,
  //         LATITUDE: item.AIS.LATITUDE,
  //         LONGITUDE: item.AIS.LONGITUDE,
  //         COURSE: item.AIS.COURSE,
  //         SPEED: item.AIS.SPEED,
  //         HEADING: item.AIS.HEADING,
  //         NAVSTAT: item.AIS.NAVSTAT,
  //         IMO: item.AIS.IMO,
  //         NAME: item.AIS.NAME,
  //         CALLSIGN: item.AIS.CALLSIGN,
  //         TYPE: item.AIS.TYPE,
  //         A: item.AIS.A,
  //         B: item.AIS.B,
  //         C: item.AIS.C,
  //         D: item.AIS.D,
  //         DRAUGHT: item.AIS.DRAUGHT,
  //         DESTINATION: item.AIS.DESTINATION,
  //         LOCODE: item.AIS.LOCODE,
  //         ETA_AIS: item.AIS.ETA_AIS,
  //         ETA: item.AIS.ETA,
  //         SRC: item.AIS.SRC,
  //         ZONE: item.AIS.ZONE,
  //         ECA: item.AIS.ECA,
  //         DISTANCE_REMAINING: item.AIS.DISTANCE_REMAINING,
  //         ETA_PREDICTED: item.AIS.ETA_PREDICTED,
  //       }));

  //       if (existingBucket) {
  //         existingBucket.AISDataObject.push(...mappedAISData);
  //         existingBucket.total_entries = existingBucket.AISDataObject.length;
  //         await existingBucket.save();
  //         VTBucketData.push(existingBucket);
  //       } else {
  //         let startTimeStamp = Date.now();
  //         const bucketData: Partial<any> = {
  //           transport_id: transportId,
  //           start_date: new Date(startTimeStamp),
  //           end_date: new Date(startTimeStamp + 24 * 60 * 60 * 1000), // 24 set from config file
  //           AISDataObject: mappedAISData,
  //           total_entries: mappedAISData.length,
  //         };

  //         const createdBucket = new this.bucketModel(bucketData);
  //         await createdBucket.save();
  //         VTBucketData.push(createdBucket);
  //       }
  //     }
  //   }

  //   // console.log(VTBucketData, "vt")
  //   return VTBucketData;
  // }

  // async createDataFromVTAPi(): Promise<any> {
  //   const organizations = await this.organizationService.getAll();

  //   if (!organizations || organizations.length === 0) {
  //     throw new Error('No organizations found');
  //   }

  //   const VTBucketData = [];
  //   const processedTransportIds = new Set<string>();

  //   for (const organization of organizations) {
  //     const transports = organization.transports;

  //     if (!transports || transports.length === 0) {
  //       console.warn(
  //         `No transports found for organization ${organization.name}`,
  //       );
  //       continue;
  //     }

  //     for (const transportId of transports) {
  //       if (processedTransportIds.has(transportId.toString())) {
  //         console.warn(`Transport ${transportId} already processed, skipping.`);
  //         continue;
  //       }

  //       const transportData =
  //         await this.trackableTransportModel.findById(transportId);

  //       const existingBucket = await this.bucketModel.findOne({
  //         transport_id: transportId,
  //         start_date: { $lt: new Date() },
  //         end_date: { $gt: new Date() },
  //       });

  //       let updated: any[];

  //       try {
  //         updated = await this.fetchDataFromAIS(transportData.imoNumber,false);
  //       } catch (error) {
  //         console.error('Error fetching AIS data:', error);
  //         updated = [];
  //       }

  //       const mappedAISData = updated.map((item) => ({
  //         MMSI: item.AIS.MMSI,
  //         TIMESTAMP: item.AIS.TIMESTAMP,
  //         LATITUDE: item.AIS.LATITUDE,
  //         LONGITUDE: item.AIS.LONGITUDE,
  //         COURSE: item.AIS.COURSE,
  //         SPEED: item.AIS.SPEED,
  //         HEADING: item.AIS.HEADING,
  //         NAVSTAT: item.AIS.NAVSTAT,
  //         IMO: item.AIS.IMO,
  //         NAME: item.AIS.NAME,
  //         CALLSIGN: item.AIS.CALLSIGN,
  //         TYPE: item.AIS.TYPE,
  //         A: item.AIS.A,
  //         B: item.AIS.B,
  //         C: item.AIS.C,
  //         D: item.AIS.D,
  //         DRAUGHT: item.AIS.DRAUGHT,
  //         DESTINATION: item.AIS.DESTINATION,
  //         LOCODE: item.AIS.LOCODE,
  //         ETA_AIS: item.AIS.ETA_AIS,
  //         ETA: item.AIS.ETA,
  //         SRC: item.AIS.SRC,
  //         ZONE: item.AIS.ZONE,
  //         ECA: item.AIS.ECA,
  //         DISTANCE_REMAINING: item.AIS.DISTANCE_REMAINING,
  //         ETA_PREDICTED: item.AIS.ETA_PREDICTED,
  //       }));

  //       if (existingBucket) {
  //         existingBucket.AISDataObject.push(...mappedAISData);
  //         existingBucket.total_entries = existingBucket.AISDataObject.length;
  //         await existingBucket.save();
  //         VTBucketData.push(existingBucket);
  //       } else {
  //         let startTimeStamp = Date.now();
  //         const bucketData: Partial<any> = {
  //           transport_id: transportId,
  //           start_date: new Date(startTimeStamp),
  //           end_date: new Date(
  //             startTimeStamp +
  //               parseInt(process.env.BucketTime) * 60 * 60 * 1000,
  //           ), // 24 set from config file
  //           AISDataObject: mappedAISData,
  //           total_entries: mappedAISData.length,
  //         };

  //         const createdBucket = new this.bucketModel(bucketData);
  //         await createdBucket.save();
  //         VTBucketData.push(createdBucket);
  //       }

  //       processedTransportIds.add(transportId.toString());
  //     }
  //   }

  //   return VTBucketData;
  // }

  // async createDataFromVTAPi_2(): Promise<any> {
  //   const organizations = await this.organizationService.getAll();

  //   if (!organizations || organizations.length === 0) {
  //     throw new Error('No organizations found');
  //   }

  //   const VTBucketData = [];
  //   const processedTransportIds = new Set<string>();

  //   for (const organization of organizations) {
  //     const transports = organization.transports;

  //     if (!transports || transports.length === 0) {
  //       console.warn(
  //         `No transports found for organization ${organization.name}`,
  //       );
  //       continue;
  //     }

  //     for (const transportId of transports) {
  //       if (processedTransportIds.has(transportId.toString())) {
  //         console.warn(
  //           `Duplicate transport ${transportId} found for organization ${organization.name}`,
  //         );
  //         continue;
  //       }

  //       const transportData =
  //         await this.trackableTransportModel.findById(transportId);
  //       const existingBucket = await this.bucketModel.findOne({
  //         transport_id: transportId,
  //       });

  //       let updated: any[];

  //       try {
  //         updated = await this.fetchDataFromAIS_2(transportData.imoNumber);
  //       } catch (error) {
  //         console.error('Error fetching AIS data:', error);
  //         updated = [];
  //       }

  //       const mappedAISData = updated.map((item) => ({
  //         MMSI: item.AIS.MMSI,
  //         TIMESTAMP: item.AIS.TIMESTAMP,
  //         LATITUDE: item.AIS.LATITUDE,
  //         LONGITUDE: item.AIS.LONGITUDE,
  //         COURSE: item.AIS.COURSE,
  //         SPEED: item.AIS.SPEED,
  //         HEADING: item.AIS.HEADING,
  //         NAVSTAT: item.AIS.NAVSTAT,
  //         IMO: item.AIS.IMO,
  //         NAME: item.AIS.NAME,
  //         CALLSIGN: item.AIS.CALLSIGN,
  //         TYPE: item.AIS.TYPE,
  //         A: item.AIS.A,
  //         B: item.AIS.B,
  //         C: item.AIS.C,
  //         D: item.AIS.D,
  //         DRAUGHT: item.AIS.DRAUGHT,
  //         DESTINATION: item.AIS.DESTINATION,
  //         LOCODE: item.AIS.LOCODE,
  //         ETA_AIS: item.AIS.ETA_AIS,
  //         ETA: item.AIS.ETA,
  //         SRC: item.AIS.SRC,
  //         ZONE: item.AIS.ZONE,
  //         ECA: item.AIS.ECA,
  //         DISTANCE_REMAINING: item.AIS.DISTANCE_REMAINING,
  //         ETA_PREDICTED: item.AIS.ETA_PREDICTED,
  //       }));

  //       if (existingBucket) {
  //         existingBucket.AISDataObject.push(...mappedAISData);
  //         existingBucket.total_entries = existingBucket.AISDataObject.length;
  //         await existingBucket.save();
  //         VTBucketData.push(existingBucket);
  //       } else {
  //         const bucketData: Partial<any> = {
  //           transport_id: transportId,
  //           start_date: new Date(),
  //           end_date: new Date(),
  //           AISDataObject: mappedAISData,
  //           total_entries: mappedAISData.length,
  //         };

  //         const createdBucket = new this.bucketModel(bucketData);
  //         await createdBucket.save();
  //         VTBucketData.push(createdBucket);
  //       }

  //       processedTransportIds.add(transportId.toString());
  //     }
  //   }

  //   return VTBucketData;
  // }

  async GetFromAisDataVTAPI(transportId: string): Promise<any> {
    const transportData =
      await this.trackableTransportModel.findById(transportId);

    let updated: any[];

    try {
      updated = await this.fetchDataFromAIS(transportData.imoNumber, true);
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
    const bucket = await this.bucketModel
      .findOne({ transport_id: transportId })
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
}
