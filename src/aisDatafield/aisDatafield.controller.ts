import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { AisDataFiledService } from "./aisDatafield.service";
import { AisDataField } from "./aisDataField.model";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("AisData API")
@Controller("aisDataFiled")
export class AisDataFiledController {
  constructor(private readonly service: AisDataFiledService) {}

  @Post("create")
  async create(@Body() data: AisDataField) {
    try {
      const created = await this.service.create(data);

      if (created) {
        return {
          success: true,
          data: created,
          message: "data created successfully",
        };
      } else {
        return {
          success: false,
          data: [],
          message: "already exist this field name",
        };
      }
    } catch (error) {
      console.error("Error creating ais:", error.message);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: "Failed to create ais",
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("getAll")
  async getAllData(
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 10,
    @Query("fieldName") fieldName: string,
  ): Promise<{ total: number; data: AisDataField[] }> {
    const options = {
      page: +page,
      pageSize: +pageSize,
      fieldName: fieldName || "",
    };

    return this.service.getAllDataFileds(options);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("custom")
  findCustomeAll() {
    return this.service.findCustomeAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @Post("update/:id")
  update(@Param("id") id: string, @Body() data: AisDataField) {
    return this.service.update(id, data);
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
