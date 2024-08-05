// bucket.controller.ts

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { BucketService } from "./bucket.service";

@ApiTags("Buckets")
@Controller("buckets")
export class BucketController {
  constructor(
    private readonly bucketService: BucketService,
    private readonly configService: ConfigService,
  ) {}

  @Get("getFromVt/:transportId")
  async getFromVt(@Param("transportId") transportId: string) {
    try {
      const latestAISData =
        await this.bucketService.GetFromAisDataVTAPI(transportId);
      return { success: true, data: latestAISData };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: "No AIS data found for the specified transportId",
        };
      } else {
        return { success: false, message: "Internal server error" };
      }
    }
  }

  @Get(":transportId")
  async getLatestAISDataByTransportId(
    @Param("transportId") transportId: string,
  ) {
    try {
      const latestAISData =
        await this.bucketService.getLatestAISDataByTransportId(transportId);
      return { success: true, data: latestAISData };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: "No AIS data found for the specified transportId",
        };
      } else {
        return { success: false, message: "Internal server error" };
      }
    }
  }

  @Get("AIS/:transportId")
  async getLatestAISDataByTransportId2(
    @Param("transportId") transportId: string,
  ) {
    try {
      const latestAISData =
        await this.bucketService.getLatestAISDataByTransportId2(transportId);
      return { success: true, data: latestAISData };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: "No AIS data found for the specified transportId",
        };
      } else {
        return { success: false, message: error.message };
      }
    }
  }

  @Get(":transportId/:time")
  async getAISDataByTransportIdTimeTendor(
    @Param("transportId") transportId: string,
    @Param("time") time: string,
  ) {
    try {
      const latestAISData =
        await this.bucketService.getAISDataByTransportIdTimeTendor(
          transportId,
          time,
        );
      return { success: true, data: latestAISData };
    } catch (error) {
      // console.log(error.message);
      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: "No AIS data found for the specified transportId",
        };
      } else {
        console.log(error.message);
        return {
          success: false,
          message: "Internal fsdfsdfs server error",
          erro: error,
        };
      }
    }
  }

  @Get("dis/:long1/:lat1/:long2/:lat2")
  async getDistance(
    @Param("long1") long1: string,
    @Param("lat1") lat1: string,
    @Param("long2") long2: string,
    @Param("lat2") lat2: string,
  ): Promise<any> {
    try {
      const result = await this.bucketService.getDistance(
        long1,
        lat1,
        long2,
        lat2,
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error };
    }
  }

  @Post("createCustom")
  async create(@Body() requestBody: any) {
    const id = requestBody.transportId;
    const customData = requestBody.customData;
    try {
      const data = await this.bucketService.createCustomData(id, customData);
      return {
        success: true,
        data: data,
        message: "Custome data add successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }
}
