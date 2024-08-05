import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Schema as MongooseSchema } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { Voyage } from "./voyage.model";
interface PaginatedOrganizations {
  data: Voyage[];
  totalCount: number;
}
@Injectable()
export class VoyageService {
  constructor(
    @InjectModel(Voyage.name) private readonly model: Model<Voyage>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(uid: string, voyage: Voyage): Promise<any> {
    const reqUser = await this.userModel.findById(uid).exec();

    if (!reqUser) {
      throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
    }

    voyage.created_by = reqUser?._id as MongooseSchema.Types.ObjectId;
    voyage.status = "onGoing";
    voyage.orgId = reqUser.organization as MongooseSchema.Types.ObjectId;

    const newData = new this.model(voyage);

    await newData.save();

    if (!newData) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return newData;
  }

  async findAll(uid: string): Promise<any> {
    const reqUser = await this.userModel
      .findById(uid)
      .populate("organization")
      .exec();

    return this.model.find({ created_by: reqUser?._id }).exec();
  }

  async getAll(uid: string, query: any): Promise<PaginatedOrganizations> {
    try {
      const { name, portId, page, pageSize } = query;

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

      const filter: Record<string, any> = {
        created_by: reqUser?._id,
      };

      if (name) {
        filter.name = new RegExp(name, "i");
      }

      if (portId) {
        filter.port = portId; // Assuming the field is named 'port' in your model
      }

      const totalCount = await this.model.countDocuments(filter);

      const data = await this.model
        .find(filter)
        .populate("port")
        .populate("transport")
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

  async findById(id: string): Promise<any> {
    return this.model.findById(id).exec();
  }

  async updateStatus(id: string, data: any): Promise<any> {
    const dataUpdate = this.model
      .findByIdAndUpdate(id, data, { new: true })
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
    // Check if the voyage exists
    const voyage = await this.model.findById({ _id: id });
    if (!voyage) {
      throw new HttpException("Voyage not found", HttpStatus.NOT_FOUND);
    }
    const deletedVoyage = await this.model.findByIdAndDelete(id);
    if (!deletedVoyage) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
