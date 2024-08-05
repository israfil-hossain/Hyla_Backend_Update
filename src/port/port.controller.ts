import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequestUser } from "src/authentication/decorator/request-user.decorator";
import { Port } from "./port.model";
import { PortService } from "./port.service";

@ApiTags("Ports")
@Controller("ports")
export class PortController {
  constructor(private readonly service: PortService) {}

  @Post("create")
  async create(@RequestUser() { userId }: ITokenPayload, @Body() alert: Port) {
    try {
      const data = await this.service.create(userId, alert);
      return {
        success: true,
        data: data,
        message: "port created successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("getAll")
  async getAllData(
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 10,
    @Query("name") name: string,
  ): Promise<{ total: number; data: Port[] }> {
    const options = {
      page: +page,
      pageSize: +pageSize,
      name: name || "",
    };

    return this.service.getAllPort(options);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() port: Port) {
    try {
      const data = this.service.update(id, port);

      return {
        success: true,
        data: data,
        message: "port updated successfully",
      };
    } catch (error) {
      console.error("Error creating:", error.message);
      return { success: false, data: [], message: error.message };
    }
  }

  @Post("active/:id")
  active(@Param("id") id: string) {
    return this.service.active(id);
  }

  @Post("deactivate/:id")
  deactivate(@Param("id") id: string) {
    return this.service.deactivate(id);
  }

  @Post("delete/:id")
  delete(@Param("id") id: string) {
    return this.service.delete(id);
  }
}
