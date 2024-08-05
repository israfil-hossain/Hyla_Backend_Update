// trackable-transport.service.ts
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  TrackableTransport,
  TrackableTransportDocument,
} from "./trackable_transport.model";
interface PaginatedOrganizations {
  transports: TrackableTransport[];
  totalCount: number;
}
@Injectable()
export class TrackableTransportService {
  constructor(
    @InjectModel(TrackableTransport.name)
    private readonly trackableTransportModel: Model<TrackableTransportDocument>,
  ) {}

  async findAll(query: any): Promise<PaginatedOrganizations> {
    try {
      const { transportName, page, pageSize } = query;

      const parsedPage = parseInt(page);
      const parsedPageSize = parseInt(pageSize);

      if (
        isNaN(parsedPage) ||
        isNaN(parsedPageSize) ||
        parsedPage < 1 ||
        parsedPageSize < 1
      ) {
        throw new BadRequestException("Invalid page or pageSize values.");
      }

      const filter: any = {};

      if (transportName) {
        const regexSearch = new RegExp(transportName, "i");

        if (!isNaN(Number(transportName))) {
          filter.imoNumber = Number(transportName);
        } else {
          filter.transportName = { $regex: regexSearch };
        }
      }

      const totalCount =
        await this.trackableTransportModel.countDocuments(filter);

      const transports = await this.trackableTransportModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((parsedPage - 1) * parsedPageSize)
        .limit(parsedPageSize)
        .exec();

      return { transports, totalCount };
    } catch (error) {
      console.error("Error in findAll:", error.message);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Internal server error occurred while fetching organizations",
      );
    }
  }

  async getAllTrackableTransports(options: {
    page: number;
    pageSize: number;
    search: string;
  }): Promise<{ total: number; data: TrackableTransport[] }> {
    const { page, pageSize, search } = options;
    const skip = (page - 1) * pageSize;
    const query = search
      ? { transportName: { $regex: new RegExp(search, "i") } }
      : {};
    const data = await this.trackableTransportModel
      .find(query)
      .skip(skip)
      .limit(pageSize)
      .exec();

    const total = await this.trackableTransportModel.countDocuments(query);

    return { total, data };
  }

  async getTrackableTransports(options: {
    search: string;
  }): Promise<TrackableTransport[]> {
    const { search } = options;

    const query: any = {};

    if (search) {
      const regexSearch = new RegExp(search, "i");

      if (!isNaN(Number(search))) {
        query.imoNumber = Number(search);
      } else {
        query.transportName = { $regex: regexSearch };
      }
    }

    const data = await this.trackableTransportModel.find(query).exec();

    return data;
  }

  async getTrackableTransportById(id: string): Promise<TrackableTransport> {
    const trackableTransport = await this.trackableTransportModel
      .findById(id)
      .exec();
    if (!trackableTransport) {
      throw new NotFoundException("TrackableTransport not found");
    }
    return trackableTransport;
  }

  async createTrackableTransport(
    trackableTransport: TrackableTransport,
  ): Promise<TrackableTransport> {
    try {
      const createdTrackableTransport = new this.trackableTransportModel(
        trackableTransport,
      );
      const data = [
        { buildYear: 2000, Engine_tier: 1, NOx_g_kwh: 17.0 },
        { buildYear: 2011, Engine_tier: 2, NOx_g_kwh: 14.4 },
        { buildYear: 2016, Engine_tier: 3, NOx_g_kwh: 3.4 },
      ];

      if (trackableTransport.buildYear) {
        const matchingData = data.find(
          (item) => item.buildYear === trackableTransport.buildYear,
        );

        if (matchingData) {
          createdTrackableTransport.NOx_g_kwh = matchingData.NOx_g_kwh;
          createdTrackableTransport.Engine_tier = matchingData.Engine_tier;
        } else {
          if (
            trackableTransport.buildYear >= 2000 &&
            trackableTransport.buildYear < 2011
          ) {
            createdTrackableTransport.NOx_g_kwh = 17.0;
            createdTrackableTransport.Engine_tier = 1;
          } else if (
            trackableTransport.buildYear >= 2011 &&
            trackableTransport.buildYear < 2016
          ) {
            createdTrackableTransport.NOx_g_kwh = 14.4;
            createdTrackableTransport.Engine_tier = 2;
          } else if (trackableTransport.buildYear >= 2016) {
            createdTrackableTransport.NOx_g_kwh = 3.4;
            createdTrackableTransport.Engine_tier = 3;
          }
        }
      }

      const savedTrackableTransport = await createdTrackableTransport.save();

      return savedTrackableTransport;
    } catch (error) {
      console.error("Error creating trackable transport:", error);

      throw new HttpException(
        "Failed to create trackable transport",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateTrackableTransport(
    id: string,
    trackableTransport: TrackableTransport,
  ): Promise<TrackableTransport> {
    try {
      const updatedTrackableTransport = await this.trackableTransportModel
        .findByIdAndUpdate(id, trackableTransport, {
          new: true,
        })
        .exec();

      if (!updatedTrackableTransport) {
        throw new NotFoundException("TrackableTransport not found");
      }

      // Define the array of objects
      const data = [
        { buildYear: 2000, tier: 1, NOx_g_kwh: 17.0 },
        { buildYear: 2011, tier: 2, NOx_g_kwh: 14.4 },
        { buildYear: 2016, tier: 3, NOx_g_kwh: 3.4 },
      ];

      if (trackableTransport.buildYear) {
        const matchingData = data.find(
          (item) => item.buildYear === trackableTransport.buildYear,
        );

        if (matchingData) {
          updatedTrackableTransport.NOx_g_kwh = matchingData.NOx_g_kwh;
          updatedTrackableTransport.Engine_tier = matchingData.tier;
        } else {
          if (
            trackableTransport.buildYear >= 2000 &&
            trackableTransport.buildYear < 2011
          ) {
            updatedTrackableTransport.NOx_g_kwh = 17.0;
            updatedTrackableTransport.Engine_tier = 1;
          } else if (
            trackableTransport.buildYear >= 2011 &&
            trackableTransport.buildYear < 2016
          ) {
            updatedTrackableTransport.NOx_g_kwh = 14.4;
            updatedTrackableTransport.Engine_tier = 2;
          } else if (trackableTransport.buildYear >= 2016) {
            updatedTrackableTransport.NOx_g_kwh = 3.4;
            updatedTrackableTransport.Engine_tier = 3;
          }
        }
        await updatedTrackableTransport.save();
      }

      return updatedTrackableTransport;
    } catch (error) {
      console.error("Error updating trackable transport:", error);

      throw new HttpException(
        "Failed to update trackable transport",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
