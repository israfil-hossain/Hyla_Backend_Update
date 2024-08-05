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
import { Alert } from "./alert.model";
import { AlertService } from "./alert.service";

@ApiTags("Alerts")
@Controller("alerts")
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post("create")
  async create(@RequestUser() { userId }: ITokenPayload, @Body() alert: Alert) {
    try {
      const data = await this.alertService.create(userId, alert);
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
  findAll(@RequestUser() { userId }: ITokenPayload) {
    return this.alertService.findAll(userId);
  }

  @Get("getAll")
  async getAll(
    @RequestUser() { userId }: ITokenPayload,
    @Query() query: any,
  ): Promise<any> {
    try {
      const data = await this.alertService.getAll(userId, query);
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
  async delete(@Body() requestBody: any) {
    try {
      await this.alertService.delete(requestBody.removeId);

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
