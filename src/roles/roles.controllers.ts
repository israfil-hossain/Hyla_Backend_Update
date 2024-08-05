// Import necessary modules and your Roles service
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequestUser } from "src/authentication/decorator/request-user.decorator";
import { Roles, RolesDocument } from "./roles.model";
import { RolesService } from "./roles.services";
@ApiTags("Roles")
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post("createRole")
  async createRole(
    @RequestUser() { userId }: ITokenPayload,
    @Body() roleData: Partial<Roles>,
  ): Promise<any> {
    try {
      const created = await this.rolesService.createRole(userId, roleData);
      console.log("created role ", created);
      return {
        success: true,
        data: created,
        message: "Role created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get("getAllRoles")
  async getAllRoles(
    @RequestUser() { userId }: ITokenPayload,
  ): Promise<RolesDocument[]> {
    try {
      return this.rolesService.getAllRoles(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }

  @Put(":id")
  async updateRole(
    @Param("id") roleId: string,
    @Body() roleData: Partial<Roles>,
  ): Promise<RolesDocument | null> {
    return this.rolesService.updateRole(roleId, roleData);
  }

  @Get(":id")
  async getRoleById(
    @Param("id") roleId: string,
  ): Promise<RolesDocument | null> {
    return this.rolesService.getRoleById(roleId);
  }
}
