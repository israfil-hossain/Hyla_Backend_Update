// Import necessary modules and your Roles service
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  Req,
  NotFoundException,
} from "@nestjs/common";
import { RolesService } from "./roles.services";
import { Roles, RolesDocument } from "./roles.model";
import { FirebaseAuthGuard } from "src/fireBaseAuth/FirebaseAuthGuard";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("Roles")
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post("createRole")
  async createRole(@Req() req, @Body() roleData: Partial<Roles>): Promise<any> {
    const userId = req.user?.uid;
    console.log("User ID :", userId);
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
  async getAllRoles(@Req() req): Promise<RolesDocument[]> {
    try {
      const userId = req.user?.uid;
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
