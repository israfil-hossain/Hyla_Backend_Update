import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Model, ObjectId } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Geofence, GeofenceDocument } from "./geofence.model";
import { User, UserDocument } from "src/user/user.model";
interface PaginatedOrganizations {
  data: Geofence[];
  totalCount: number;
}
@Injectable()
export class GeofenceService {
  constructor(
    @InjectModel(Geofence.name) private geofenceModel: Model<GeofenceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(uid: string, geofence: Geofence): Promise<Geofence> {
    const reqUser = await this.userModel.findOne({ idp_id: uid }).exec();

    if (!reqUser) {
      throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
    }

    if (geofence.activeForAll === true) {
      const transportIds = reqUser.toi.map(
        (transport: any) => transport.transportId?._id,
      );

      geofence.transports = transportIds.map((transportId) => ({
        transportId,
        isTrigger: false,
        alerts: geofence.alerts.map((alertId) => ({ alertId, status: false })),
      }));
    }

    geofence.created_by = reqUser?._id as ObjectId;

    const newData = new this.geofenceModel(geofence);

    const createdData = await newData.save();

    if (!createdData) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return createdData;
  }

  async findAll(uid: string): Promise<any> {
    const reqUser = await this.userModel
      .findOne({ idp_id: uid })
      .populate("organization")
      .exec();

    return this.geofenceModel.find({ created_by: reqUser?._id }).exec();
  }

  async getAll(uid: string): Promise<any> {
    const reqUser = await this.userModel
      .findOne({ idp_id: uid })
      .populate("organization")
      .exec();

    return this.geofenceModel
      .find({ created_by: reqUser?._id, activeForAll: false })
      .exec();
  }

  async findById(id: string): Promise<Geofence> {
    const geofence = await this.geofenceModel.findById(id).exec();
    if (!geofence) {
      throw new NotFoundException("Geofence not found");
    }
    return geofence;
  }

  async findById_2(id: string): Promise<Geofence> {
    const geofence = await this.geofenceModel
      .findById(id)
      .populate("alerts")
      .exec();
    if (!geofence) {
      throw new NotFoundException("Geofence not found");
    }
    return geofence;
  }

  async update(uid: string, id: string, geofence: Geofence): Promise<Geofence> {
    try {
      const reqUser = await this.userModel.findOne({ idp_id: uid }).exec();

      if (!reqUser) {
        throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
      }

      const existingGeofence = await this.geofenceModel.findById(id).exec();

      if (!existingGeofence) {
        throw new HttpException("Geofence not found.", HttpStatus.NOT_FOUND);
      }

      existingGeofence.activeForAll = geofence.activeForAll;

      if (existingGeofence.activeForAll === true) {
        const transportIds = reqUser.toi.map(
          (transport: any) => transport.transportId?._id,
        );
        await this.userModel.updateMany(
          { "toi.geofences.geoId": id },
          { $pull: { "toi.$[].geofences": { geoId: id } } },
          { arrayFilters: [{ "geofences.geoId": id }] },
        );

        existingGeofence.transports = transportIds.map((transportId) => ({
          transportId,
          isTrigger: false,
          alerts: geofence.alerts.map((alertId) => ({
            alertId,
            status: false,
          })),
        }));
      } else {
        existingGeofence.transports = [];
      }
      existingGeofence.alerts = geofence.alerts;
      existingGeofence.alertOnEmail = geofence.alertOnEmail;
      existingGeofence.alertOnNotification = geofence.alertOnNotification;
      existingGeofence.updated_by = reqUser?._id as ObjectId;
      const updatedGeofence = await existingGeofence.save();

      return updatedGeofence;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        "Oops!! Something went wrong while updating the geofence.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateGeofenceGeometry(
    uid: string,
    id: string,
    geofence: Geofence,
  ): Promise<Geofence> {
    try {
      const reqUser = await this.userModel.findOne({ idp_id: uid }).exec();

      if (!reqUser) {
        throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
      }

      const existingGeofence = await this.geofenceModel.findById(id).exec();

      if (!existingGeofence) {
        throw new HttpException("Geofence not found.", HttpStatus.NOT_FOUND);
      }

      existingGeofence.geometry = geofence.geometry;
      existingGeofence.updated_by = reqUser?._id as ObjectId;

      const updatedGeofence = await existingGeofence.save();

      return updatedGeofence;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        "Oops!! Something went wrong while updating the geofence.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<Geofence> {
    const deletedGeofence = await this.geofenceModel
      .findByIdAndDelete(id)
      .lean()
      .exec();

    if (!deletedGeofence) {
      throw new NotFoundException("Geofence not found");
    }

    return deletedGeofence as Geofence;
  }

  async getAllPagination(
    uid: string,
    query: any,
  ): Promise<PaginatedOrganizations> {
    try {
      const { name, page, pageSize } = query;

      const parsedPage = parseInt(page);
      const parsedPageSize = parseInt(pageSize);

      const reqUser = await this.userModel
        .findOne({ idp_id: uid })
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

      const totalCount = await this.geofenceModel.countDocuments(filter);

      const data = await this.geofenceModel
        .find(filter)
        .skip((parsedPage - 1) * parsedPageSize)
        .limit(parsedPageSize)
        .exec();

      return { data, totalCount };
    } catch (error) {
      console.error("Error in findAll:", error.message);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Internal server error occurred while fetching organizations",
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Find the alert to delete
      const geo = await this.geofenceModel.findById(id);
      if (!geo) {
        throw new HttpException("Geofence not found", HttpStatus.NOT_FOUND);
      }

      const deleteGeo = await this.geofenceModel.findByIdAndDelete(id);
      if (!deleteGeo) {
        throw new HttpException("Failed to delete geo", HttpStatus.BAD_REQUEST);
      }

      await this.userModel.updateMany(
        { "toi.geofences.geoId": id },
        { $pull: { "toi.$[].geofences": { geoId: id } } },
        { arrayFilters: [{ "geofences.geoId": id }] },
      );
    } catch (error) {
      console.error("Error deleting geoId:", error);
      throw new HttpException(
        "Oops! Something went wrong.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
