import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/user.dto";
import { User } from "./user.model";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@Req() req): Promise<User[]> {
    const uid = req.user?.uid;
    const users = await this.userService.getAllUsers(uid);
    return users;
  }

  @Get("profile")
  async getUserProfile(@Req() req): Promise<User | null> {
    const userId = req.user?.uid;
    if (!userId) {
      throw new NotFoundException("User ID not found in the request");
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  @Get("getAll")
  async getAll_users(
    @Req() req,
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 10,
    @Query("name") name: string,
  ): Promise<{ total: number; data: User[] }> {
    const options = {
      page: +page,
      pageSize: +pageSize,
      name: name || "",
    };
    const uid = req.user?.uid;
    return this.userService.getAllUserPagination(uid, options);
  }

  @Get("isSuperUser")
  async isSuperUserByIdpId(@Req() req): Promise<boolean | null> {
    try {
      const userId = req.user?.uid;
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
    @Req() req,
    @Body() createUserDto: CreateUserDto,
  ): Promise<any> {
    const uid = req.user?.uid;
    try {
      const created = await this.userService.createUser(uid, createUserDto);
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
  async updateToi(@Req() req, @Body() requestBody: any): Promise<any> {
    const uid = req.user?.uid;

    try {
      const toiData = requestBody.ids;

      const data = await this.userService.updateToi(uid, toiData);

      return data;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to update Toi",
      };
    }
  }

  @Post("selectToi")
  async selectToi(@Req() req, @Body() requestBody: any): Promise<any> {
    const uid = req.user?.uid;

    try {
      const toiData = requestBody.ids;
      const isSelected = requestBody.isSelected;

      const data = await this.userService.selectedTransport(
        uid,
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
  async assignAlert(@Req() req, @Body() requestBody: any): Promise<any> {
    const uid = req.user?.uid;

    try {
      const toiData = requestBody.transportId;
      const alertIds = requestBody.alertIds;

      await this.userService.assignAlert(uid, toiData, alertIds);

      return { success: true, message: "Toi updated successfully" };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to update Toi",
      };
    }
  }

  @Post("assignGeo")
  async assignGeo(@Req() req, @Body() requestBody: any): Promise<any> {
    const uid = req.user?.uid;
    try {
      const toiData = requestBody.transportId;
      const ids = requestBody.Ids;

      const data = await this.userService.assignGeofence(uid, toiData, ids);

      return data;
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, message: error.message };
    }
  }

  @Post("removeFromToi")
  async removeFromToi(@Req() req, @Body() requestBody: any): Promise<any> {
    const uid = req.user?.uid;
    const transportId = requestBody.removeId;

    try {
      await this.userService.removeFromToi(uid, transportId);

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
  async removeAlertFromToi(@Req() req, @Body() requestBody: any): Promise<any> {
    const uid = req.user?.uid;
    const transportId = requestBody.removeId;
    const alertId = requestBody.removeAlertId;

    try {
      await this.userService.removeAlertFromToi(uid, transportId, alertId);

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
    @Req() req,
    @Body() requestBody: any,
  ): Promise<any> {
    const uid = req.user?.uid;
    const transportId = requestBody.removeId;
    const geoId = requestBody.removeGeoId;

    try {
      await this.userService.removeGeofenceFromToi(uid, transportId, geoId);

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
    @Req() req,
    @Param("userId") userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<any> {
    const uid = req.user?.uid;
    try {
      const update = this.userService.updateUser(uid, userId, updateUserDto);
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

  @Post("/forgot-password")
  async forgotPassword(@Body("email") email: string): Promise<void> {
    console.log(email);
    await this.userService.forgotPassword(email);
  }

  @Post("filterField")
  async updateFilterField(
    @Req() req,
    @Body() body: { hiddenColumns: string[]; visibleColumnsOrder: string[] },
  ) {
    const uid = req.user?.uid;

    try {
      const updatedUser = await this.userService.updateFilterField(
        uid,
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
