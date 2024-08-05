// organization.controller.ts

import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { CreateOrganizationDto } from "./dto/organization.dto";
import { FirebaseAuthGuard } from "src/fireBaseAuth/FirebaseAuthGuard";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("Organizations")
@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post("createOrg")
  async create(
    @Req() req,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const uid = req.user?.uid;

    try {
      const created = await this.organizationService.create(
        uid,
        createOrganizationDto,
      );

      return {
        success: true,
        data: created,
        message: "Organization created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get("getAll")
  async findAll(@Query() query: any): Promise<any> {
    try {
      const organizations = await this.organizationService.findAll(query);
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

  @Get("getOrg/:id")
  async findById(@Param("id") id: string): Promise<any> {
    return this.organizationService.findByIdWithUser(id);
  }

  @Post("updateOrg/:id")
  async updateOrganization(
    @Param("id") id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    try {
      const update = await this.organizationService.updateOrg(
        id,
        updateOrganizationDto,
      );

      return {
        success: true,
        data: update,
        message: "update successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }
}
