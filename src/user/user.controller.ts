import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequestUser } from "src/authentication/decorator/request-user.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/user.dto";
import { User } from "./user.model";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@RequestUser() { userId }: ITokenPayload): Promise<User[]> {
    const users = await this.userService.getAllUsers(userId);
    return users;
  }

  @Get("profile")
  async getUserProfile(
    @RequestUser() { userId }: ITokenPayload,
  ): Promise<User | null> {
    if (!userId) {
      throw new NotFoundException("User ID not found in the request");
    }

    const user = await this.userService.getProfile(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Get("getAll")
  async getAll_users(
    @RequestUser() { userId }: ITokenPayload,
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 10,
    @Query("name") name: string,
  ): Promise<{ total: number; data: User[] }> {
    const options = {
      page: +page,
      pageSize: +pageSize,
      name: name || "",
    };
    return this.userService.getAllUserPagination(userId, options);
  }

  @Get("isSuperUser")
  async isSuperUserByIdpId(
    @RequestUser() { userId }: ITokenPayload,
  ): Promise<boolean | null> {
    try {
      return this.userService.checkIfUserIsSuperUser(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }

  @Post("createUser")
  async createUser(
    @RequestUser() { userId }: ITokenPayload,
    @Body() createUserDto: CreateUserDto,
  ): Promise<any> {
    try {
      const created = await this.userService.createUser(userId, createUserDto);
      return {
        success: true,
        data: created,
        message: "User created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Post("updateToi")
  async updateToi(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    try {
      const toiData = requestBody.ids;

      const data = await this.userService.updateToi(userId, toiData);

      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to update Toi",
      };
    }
  }

  @Post("selectToi")
  async selectToi(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    try {
      const toiData = requestBody.ids;
      const isSelected = requestBody.isSelected;

      const data = await this.userService.selectedTransport(
        userId,
        toiData,
        isSelected,
      );

      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to update Toi",
      };
    }
  }

  @Post("assignAlert")
  async assignAlert(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    try {
      const toiData = requestBody.transportId;
      const alertIds = requestBody.alertIds;

      await this.userService.assignAlert(userId, toiData, alertIds);

      return { success: true, message: "Toi updated successfully" };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to update Toi",
      };
    }
  }

  @Post("assignGeo")
  async assignGeo(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    try {
      const toiData = requestBody.transportId;
      const ids = requestBody.Ids;

      const data = await this.userService.assignGeofence(userId, toiData, ids);

      return data;
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, message: error.message };
    }
  }

  @Post("removeFromToi")
  async removeFromToi(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    const transportId = requestBody.removeId;

    try {
      await this.userService.removeFromToi(userId, transportId);

      return {
        success: true,
        message: "Transport removed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to remove transport",
      };
    }
  }

  @Post("removeAlertFromToi")
  async removeAlertFromToi(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    const transportId = requestBody.removeId;
    const alertId = requestBody.removeAlertId;

    try {
      await this.userService.removeAlertFromToi(userId, transportId, alertId);

      return {
        success: true,
        message: "Alert removed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to remove transport",
      };
    }
  }
  @Post("removeGeofenceFromToi")
  async removeGeofenceFromToi(
    @RequestUser() { userId }: ITokenPayload,
    @Body() requestBody: any,
  ): Promise<any> {
    const transportId = requestBody.removeId;
    const geoId = requestBody.removeGeoId;

    try {
      await this.userService.removeGeofenceFromToi(userId, transportId, geoId);

      return {
        success: true,
        message: "Geofence removed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to remove transport",
      };
    }
  }

  @Post("updateUser/:userId")
  async updateUser(
    @RequestUser() { userId }: ITokenPayload,
    @Param("userId") updateUserId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    try {
      const update = this.userService.updateUser(
        userId,
        updateUserId,
        updateUserDto,
      );
      return {
        success: true,
        data: update,
        message: "User updated successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get(":id")
  async getUserById(@Param("id") userId: string): Promise<User | null> {
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Post("active/:id")
  active(@Param("id") id: string) {
    return this.userService.active(id);
  }

  @Post("deactivate/:id")
  deactivate(@Param("id") id: string) {
    return this.userService.deactivate(id);
  }

  @Post("delete/:id")
  delete(@Param("id") id: string) {
    return this.userService.delete(id);
  }

  @Post("filterField")
  async updateFilterField(
    @RequestUser() { userId }: ITokenPayload,
    @Body() body: { hiddenColumns: string[]; visibleColumnsOrder: string[] },
  ) {
    try {
      const updatedUser = await this.userService.updateFilterField(
        userId,
        body.hiddenColumns,
        body.visibleColumnsOrder,
      );
      return {
        success: true,
        data: updatedUser,
        message: "Field updated successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }
}
