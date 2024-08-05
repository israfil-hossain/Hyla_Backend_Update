import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { Alert } from "./alert.model";
interface PaginatedOrganizations {
  data: Alert[];
  totalCount: number;
}
@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name) private readonly alertModel: Model<Alert>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(uid: string, alert: Alert): Promise<any> {
    const reqUser = await this.userModel.findById(uid).exec();

    if (!reqUser) {
      throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
    }

    alert.created_by = reqUser._id as ObjectId;

    const newAlert = new this.alertModel(alert);

    const createdAlert = await newAlert.save();

    if (!createdAlert) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return createdAlert;
  }

  async findAll(uid: string): Promise<any> {
    const reqUser = await this.userModel
      .findById(uid)
      .populate("organization")
      .exec();

    return this.alertModel.find({ created_by: reqUser?._id }).exec();
  }

  async getAll(uid: string, query: any): Promise<PaginatedOrganizations> {
    try {
      const { name, page, pageSize } = query;

      const parsedPage = parseInt(page);
      const parsedPageSize = parseInt(pageSize);

      const reqUser = await this.userModel
        .findById(uid)
        .populate("organization")
        .exec();

      if (
        isNaN(parsedPage) ||
        isNaN(parsedPageSize) ||
        parsedPage < 1 ||
        parsedPageSize < 1
      ) {
        throw new BadRequestException("Invalid page or pageSize values.");
      }

      // let filter: any = {};

      const filter: Record<string, any> = {
        created_by: reqUser?._id,
      };

      if (name) {
        filter.name = new RegExp(name, "i");
      }

      const totalCount = await this.alertModel.countDocuments(filter);

      const data = await this.alertModel
        .find(filter)
        .skip((parsedPage - 1) * parsedPageSize)
        .limit(parsedPageSize)
        .exec();

      return { data, totalCount };
    } catch (error) {
      console.error("Error in findAll:", error.message);

      if (error instanceof BadRequestException) {
        throw error; // Rethrow BadRequestException with a custom message
      }

      throw new InternalServerErrorException(
        "Internal server error occurred while fetching organizations",
      );
    }
  }

  async findById(id: string): Promise<Alert> {
    return this.alertModel.findById(id).exec();
  }

  async update(id: string, alert: Alert): Promise<Alert> {
    const dataUpdate = this.alertModel
      .findByIdAndUpdate(id, alert, { new: true })
      .exec();

    if (!dataUpdate) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return dataUpdate;
  }

  async delete(id: string): Promise<void> {
    try {
      // Find the alert to delete
      const alert = await this.alertModel.findById(id);
      if (!alert) {
        throw new HttpException("Alert not found", HttpStatus.NOT_FOUND);
      }

      const deletedAlert = await this.alertModel.findByIdAndDelete(id);
      if (!deletedAlert) {
        throw new HttpException(
          "Failed to delete alert",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userModel.updateMany(
        { "toi.alerts.alertId": id },
        { $pull: { "toi.$[].alerts": { alertId: id } } },
        { arrayFilters: [{ "alert.alertId": id }] },
      );
    } catch (error) {
      console.error("Error deleting alert:", error.message);
      throw new HttpException(
        "Oops! Something went wrong.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
