import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ObjectId, Types } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { Roles, RolesDocument } from "./roles.model";

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Roles.name) private readonly rolesModel: Model<RolesDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createRole(userId: string, roleData: Partial<Roles>): Promise<any> {
    const reqUser = await this.userModel.findOne({ idp_id: userId }).exec();
    console.log("ReqUser: ", reqUser);

    if (!reqUser) {
      throw new HttpException("User not found.", HttpStatus.BAD_REQUEST);
    }

    roleData.created_by = reqUser._id as ObjectId;
    roleData.organization = reqUser.organization;

    const createdRole = new this.rolesModel(roleData);

    const newData = await createdRole.save();

    if (!newData) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return newData;
  }

  async updateRole(
    roleId: string,
    roleData: Partial<Roles>,
  ): Promise<RolesDocument | null> {
    return this.rolesModel
      .findByIdAndUpdate(roleId, roleData, { new: true })
      .exec();
  }

  async getAllRoles(userId: string): Promise<RolesDocument[]> {
    try {
      const reqUser = await this.userModel.findOne({ idp_id: userId }).exec();

      if (!reqUser) {
        throw new NotFoundException("User not found");
      }

      const roles = await this.rolesModel
        .find({
          organization: reqUser.organization
            ? new Types.ObjectId(reqUser.organization.toString())
            : null,
        })
        .exec();
      return roles;
    } catch (error) {
      throw new NotFoundException(
        `Error while fetching roles: ${error.message}`,
      );
    }
  }

  async getRoleById(roleId: string): Promise<RolesDocument | null> {
    return this.rolesModel.findById(roleId).exec();
  }
}
