// trackable-transport.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { TrackableTransportService } from "./trackable_transport.service";
import { TrackableTransport } from "./trackable_transport.model";
import { FirebaseAuthGuard } from "src/fireBaseAuth/FirebaseAuthGuard";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Track Transports")
@Controller("trackable-transports")
export class TrackableTransportController {
  constructor(
    private readonly trackableTransportService: TrackableTransportService,
  ) {}

  @Get()
  async getAllTrackableTransports(
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 10,
    @Query("search") search: string,
  ): Promise<{ total: number; data: TrackableTransport[] }> {
    const options = {
      page: +page,
      pageSize: +pageSize,
      search: search || "",
    };

    return this.trackableTransportService.getAllTrackableTransports(options);
  }

  @Get("getTransport")
  async getTrackableTransports(
    @Query("search") search: string,
  ): Promise<TrackableTransport[]> {
    const options = {
      search: search || "",
    };
    return this.trackableTransportService.getTrackableTransports(options);
  }

  @Get("getAll")
  @UseGuards(FirebaseAuthGuard)
  async findAll(@Query() query: any): Promise<any> {
    try {
      const organizations = await this.trackableTransportService.findAll(query);
      return organizations;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          "Internal server error occurred while processing the request",
        );
      }
    }
  }

  @Get(":id")
  async getTrackableTransportById(
    @Param("id") id: string,
  ): Promise<TrackableTransport> {
    return this.trackableTransportService.getTrackableTransportById(id);
  }

  @Post("create")
  async createTrackableTransport(
    @Body() trackableTransport: TrackableTransport,
  ): Promise<TrackableTransport> {
    try {
      const createdTrackableTransport =
        await this.trackableTransportService.createTrackableTransport(
          trackableTransport,
        );
      return createdTrackableTransport;
    } catch (error) {
      console.error("Error creating trackable transport:", error);

      throw new HttpException(
        "Failed to create trackable transport",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("update/:id")
  async updateTrackableTransport(
    @Param("id") id: string,
    @Body() trackableTransport: TrackableTransport,
  ): Promise<TrackableTransport> {
    return this.trackableTransportService.updateTrackableTransport(
      id,
      trackableTransport,
    );
  }
}
