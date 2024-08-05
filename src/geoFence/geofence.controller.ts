import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Req,
  BadRequestException,
  Query,
  InternalServerErrorException,
} from "@nestjs/common";
import { GeofenceService } from "./geofence.service";
import { Geofence } from "./geofence.model";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("GeoFences")
@Controller("geofences")
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  @Post()
  async create(@Req() req, @Body() geofence: Geofence): Promise<any> {
    const uid = req.user?.uid;
    try {
      const data = this.geofenceService.create(uid, geofence);
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
  async getAllPagination(@Req() req, @Query() query: any): Promise<any> {
    try {
      const uid = req.user?.uid;
      const data = await this.geofenceService.getAllPagination(uid, query);
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
  findAll(@Req() req) {
    const uid = req.user?.uid;
    return this.geofenceService.findAll(uid);
  }

  @Get("getAll")
  getAll(@Req() req) {
    const uid = req.user?.uid;
    return this.geofenceService.getAll(uid);
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
    @Req() req,
    @Param("id") id: string,
    @Body() geofence: Geofence,
  ): Promise<any> {
    try {
      const uid = req.user?.uid;
      const updatedGeofence = await this.geofenceService.update(
        uid,
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
    @Req() req,
    @Param("id") id: string,
    @Body() geofence: Geofence,
  ): Promise<any> {
    try {
      const uid = req.user?.uid;
      const updatedGeofence = await this.geofenceService.updateGeofenceGeometry(
        uid,
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
  async delete(@Req() req, @Body() requestBody: any) {
    const uid = req.user?.uid;
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
