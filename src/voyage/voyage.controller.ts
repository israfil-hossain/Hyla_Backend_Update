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

import { VoyageService } from "./voyage.service";
import { Voyage } from "./voyage.model";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("Voyage")
@Controller("voyage")
export class VoyageController {
  constructor(private readonly service: VoyageService) {}

  @Post("create")
  async create(@Req() req, @Body() voyage: Voyage) {
    const uid = req.user?.uid;
    try {
      const data = await this.service.create(uid, voyage);
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
  async getAll(@Req() req, @Query() query: any): Promise<any> {
    try {
      const uid = req.user?.uid;
      const data = await this.service.getAll(uid, query);
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
  async delete(@Req() req, @Body() requestBody: any) {
    const uid = req.user?.uid;
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
