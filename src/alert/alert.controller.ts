import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  HttpException,
  Req,
  Query,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { AlertService } from "./alert.service";
import { Model } from "mongoose";
import { Alert, AlertSchema } from "./alert.model";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("Alerts")
@Controller("alerts")
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post("create")
  async create(@Req() req, @Body() alert: Alert) {
    const uid = req.user?.uid;
    try {
      const data = await this.alertService.create(uid, alert);
      return {
        success: true,
        data: data,
        message: "alert created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get()
  findAll(@Req() req) {
    const uid = req.user?.uid;
    return this.alertService.findAll(uid);
  }

  @Get("getAll")
  async getAll(@Req() req, @Query() query: any): Promise<any> {
    try {
      const uid = req.user?.uid;
      const data = await this.alertService.getAll(uid, query);
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

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.alertService.findById(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() alert: Alert) {
    try {
      const data = this.alertService.update(id, alert);

      return {
        success: true,
        data: data,
        message: "alert updated successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Post("delete")
  async delete(@Req() req, @Body() requestBody: any) {
    const uid = req.user?.uid;
    const id = requestBody.removeId;
    try {
      await this.alertService.delete(id);

      return {
        success: true,
        message: "Alert delete successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, message: error.message };
    }
  }
}
