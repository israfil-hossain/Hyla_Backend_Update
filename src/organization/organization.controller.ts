// organization.controller.ts

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
import { CreateOrganizationDto } from "./dto/organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { OrganizationService } from "./organization.service";

@ApiTags("Organizations")
@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post("createOrg")
  async create(
    @RequestUser() { userId }: ITokenPayload,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    try {
      const created = await this.organizationService.create(
        userId,
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
