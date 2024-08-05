import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequestUser } from "src/authentication/decorator/request-user.decorator";
import { Geofence } from "./geofence.model";
import { GeofenceService } from "./geofence.service";
@ApiTags("GeoFences")
@Controller("geofences")
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @Post()
  async create(
    @RequestUser() { userId }: ITokenPayload,
    @Body() geofence: Geofence,
  ): Promise<any> {
    try {
      const data = this.geofenceService.create(userId, geofence);
      return {
        success: true,
        data: data,
        message: "geofence created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get("getAllPagination")
  async getAllPagination(
    @RequestUser() { userId }: ITokenPayload,
    @Query() query: any,
  ): Promise<any> {
    try {
      const data = await this.geofenceService.getAllPagination(userId, query);
      return data;
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

  @Get()
  findAll(@RequestUser() { userId }: ITokenPayload) {
    return this.geofenceService.findAll(userId);
  }

  @Get("getAll")
  getAll(@RequestUser() { userId }: ITokenPayload) {
    return this.geofenceService.getAll(userId);
  }

  @Get(":id")
  async findById(@Param("id") id: string): Promise<Geofence> {
    return this.geofenceService.findById(id);
  }

  @Get("geo/:id")
  async findById_2(@Param("id") id: string): Promise<Geofence> {
    return this.geofenceService.findById_2(id);
  }

  @Put(":id")
  async update(
    @RequestUser() { userId }: ITokenPayload,
    @Param("id") id: string,
    @Body() geofence: Geofence,
  ): Promise<any> {
    try {
      const updatedGeofence = await this.geofenceService.update(
        userId,
        id,
        geofence,
      );

      return {
        success: true,
        data: updatedGeofence,
        message: "Geofence updated successfully",
      };
    } catch (error) {
      console.error("Error updating geofence:", error);
      return { success: false, data: null, message: error.message };
    }
  }

  @Put("geometry/:id")
  async updateGeometry(
    @RequestUser() { userId }: ITokenPayload,
    @Param("id") id: string,
    @Body() geofence: Geofence,
  ): Promise<any> {
    try {
      const updatedGeofence = await this.geofenceService.updateGeofenceGeometry(
        userId,
        id,
        geofence,
      );

      return {
        success: true,
        data: updatedGeofence,
        message: "Geofence updated successfully",
      };
    } catch (error) {
      console.error("Error updating geofence:", error);
      return { success: false, data: null, message: error.message };
    }
  }

  @Post("delete")
  async delete(@Body() requestBody: any) {
    const id = requestBody.removeId;
    try {
      await this.geofenceService.delete(id);

      return {
        success: true,
        message: "Geofence delete successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, message: error.message };
    }
  }
}
