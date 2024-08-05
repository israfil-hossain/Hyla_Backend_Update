import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Req,
  BadRequestException,
  Query,
  InternalServerErrorException,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("Notification")
@Controller("notification")
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  findAll(@Req() req) {
    const uid = req.user?.uid;
    return this.service.findAll(uid);
  }

  @Get("unread")
  getAllunread(@Req() req) {
    const uid = req.user?.uid;
    return this.service.getAllUnreadNotification(uid);
  }

  @Get("getunread")
  getunread(@Req() req) {
    const uid = req.user?.uid;
    return this.service.UnreadNotification(uid);
  }

  @Get(":id")
  async findById(@Param("id") id: string): Promise<any> {
    return this.service.findById(id);
  }

  @Post("delete")
  async delete(@Req() req, @Body() requestBody: any) {
    const uid = req.user?.uid;
    const id = requestBody.removeId;
    try {
      await this.service.remove(id);

      return {
        success: true,
        message: "Notification remove successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, message: error.message };
    }
  }
}
