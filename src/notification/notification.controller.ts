import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequestUser } from "src/authentication/decorator/request-user.decorator";
import { NotificationService } from "./notification.service";
@ApiTags("Notification")
@Controller("notification")
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  findAll(@RequestUser() { userId }: ITokenPayload) {
    return this.service.findAll(userId);
  }

  @Get("unread")
  getAllunread(@RequestUser() { userId }: ITokenPayload) {
    return this.service.getAllUnreadNotification(userId);
  }

  @Get("getunread")
  getunread(@RequestUser() { userId }: ITokenPayload) {
    return this.service.UnreadNotification(userId);
  }

  @Get(":id")
  async findById(@Param("id") id: string): Promise<any> {
    return this.service.findById(id);
  }

  @Post("delete")
  async delete(@Body() requestBody: any) {
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
