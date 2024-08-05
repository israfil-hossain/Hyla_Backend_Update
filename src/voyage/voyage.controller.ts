import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
} from "@nestjs/common";

import { ApiTags } from "@nestjs/swagger";
import { RequestUser } from "src/authentication/decorator/request-user.decorator";
import { Voyage } from "./voyage.model";
import { VoyageService } from "./voyage.service";
@ApiTags("Voyage")
@Controller("voyage")
export class VoyageController {
  constructor(private readonly service: VoyageService) {}

  @Post("create")
  async create(
    @RequestUser() { userId }: ITokenPayload,
    @Body() voyage: Voyage,
  ) {
    try {
      const data = await this.service.create(userId, voyage);
      return {
        success: true,
        data: data,
        message: "voyage created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get("getAll")
  async getAll(
    @RequestUser() { userId }: ITokenPayload,
    @Query() query: any,
  ): Promise<any> {
    try {
      const data = await this.service.getAll(userId, query);
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
    return this.service.findById(id);
  }

  @Post("update/:id")
  update(@Param("id") id: string, @Body() data: any) {
    try {
      const updated = this.service.updateStatus(id, data);

      return {
        success: true,
        data: updated,
        message: "Voayge status update successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, updated: [], message: error.message };
    }
  }

  @Post("delete")
  async delete(@Body() requestBody: any) {
    const id = requestBody.removeId;
    try {
      await this.service.delete(id);

      return {
        success: true,
        message: "Voayge delete successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, message: error.message };
    }
  }
}
