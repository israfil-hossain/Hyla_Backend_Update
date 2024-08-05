import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Schema as MongooseSchema } from "mongoose";
import { EncryptionService } from "src/encryption/encryption.service";
import { Geofence, GeofenceDocument } from "src/geoFence/geofence.model";
import { Roles, RolesDocument } from "src/roles/roles.model";
import {
  Organization,
  OrganizationDocument,
} from "../organization/organization.model";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/user.dto";
import { User, UserDocument } from "./user.model";
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Roles.name) private readonly rolesModel: Model<RolesDocument>,
    @InjectModel(Geofence.name)
    private readonly geoModel: Model<GeofenceDocument>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createSuper(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, roles } = createUserDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const userPermissions: Record<string, string> = {};

    for (const roleId of roles) {
      const role = await this.rolesModel.findById(roleId).exec();

      if (role) {
        role.permissions.forEach((permission: any) => {
          const { category, read, write } = permission;

          if (!(category in userPermissions)) {
            userPermissions[category] = "";
          }

          if (read && !userPermissions[category].includes("r")) {
            userPermissions[category] += "r";
          }

          if (write && !userPermissions[category].includes("w")) {
            userPermissions[category] += "w";
          }
        });
      }
    }

    const createdUser = new this.userModel({
      name,
      email,
      roles,
      permissions: userPermissions,
    });

    return await createdUser.save();
  }

  async getProfile(userId: string): Promise<User | null> {
    const user = await this.userModel
      .findById(userId)
      .populate("organization")
      .populate({
        path: "toi.transportId",
        model: "TrackableTransport",
      })
      .populate({
        path: "toi.alerts.alertId",
        model: "Alert",
      })
      .populate({
        path: "toi.geofences.geoId",
        model: "Geofence",
      })
      .exec();
    return user || null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const user = await this.userModel
      .findById(userId)
      .populate("organization")
      .populate("toi")
      .exec();
    return user || null;
  }

  async checkIfUserIsSuperUser(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user.isSuperUser;
  }

  async getAllUsers(uid: string): Promise<User[]> {
    const reqUser = await this.userModel
      .findById(uid)
      .populate("organization")
      .exec();

    if (!reqUser) {
      throw new NotFoundException("User not found");
    }
    const users = await this.userModel
      .find({
        isSuperUser: false,
        isOrganizationOwner: false,
        organization: reqUser.organization,
      })
      .populate("roles")
      .exec();
    return users;
  }

  async getAllUserPagination(
    uid: string,
    options: {
      page: number;
      pageSize: number;
      name: string;
    },
  ): Promise<{ total: number; data: User[] }> {
    const { page, pageSize, name } = options;
    const skip = (page - 1) * pageSize;

    const reqUser = await this.userModel
      .findById(uid)
      .populate("organization")
      .exec();

    if (!reqUser) {
      throw new NotFoundException("User not found");
    }

    const query: Record<string, any> = {
      isSuperUser: false,
      isOrganizationOwner: false,
      organization: reqUser.organization,
    };

    if (name) {
      query.name = { $regex: new RegExp(name, "i") };
    }
    const data = await this.userModel
      .find(query)
      .skip(skip)
      .limit(pageSize)
      .populate("roles")
      .exec();

    const total = await this.userModel.countDocuments(query);

    return { total, data };
  }

  async createUser(uid: string, createUserDto: CreateUserDto): Promise<User> {
    const { name = "", email = "", password = "", roles = [] } = createUserDto;

    const reqUser = await this.userModel.findById(uid).exec();

    if (!reqUser) {
      throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
    }

    const checkUserIsOrganizationOwner = await this.organizationModel
      .findOne({ _id: reqUser.organization })
      .exec();

    if (!checkUserIsOrganizationOwner) {
      throw new NotFoundException(
        "This user is not the owner of any organization",
      );
    }

    const existingUser = await this.userModel.findOne({ email }).exec();

    if (existingUser) {
      throw new HttpException(
        "This user already exists.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const userPermissions: Record<string, string> = {};

    for (const roleId of roles) {
      const role = await this.rolesModel.findById(roleId).exec();

      if (role) {
        role.permissions.forEach((permission: any) => {
          const { category, read, write } = permission;

          if (!(category in userPermissions)) {
            userPermissions[category] = "";
          }

          if (read && !userPermissions[category].includes("r")) {
            userPermissions[category] += "r";
          }

          if (write && !userPermissions[category].includes("w")) {
            userPermissions[category] += "w";
          }
        });
      }
    }

    const hashedPassword = await this.encryptionService.hashPassword(password);

    const createdUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
      // organization: reqUser.organization,
      created_by: reqUser?._id,
      roles,
      permissions: userPermissions,
    });

    const newData = await createdUser.save();

    // await this.mailerService.sendWelcomeEmail(
    //   createdUser.email,
    //   createdUser.name,
    //   checkUserIsOrganizationOwner.name,
    //   password,
    // );

    if (!newData) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return newData;
  }

  async updateUser(
    uid: string,
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const { name, roles } = updateUserDto;

    const reqUser = await this.userModel.findById(uid).exec();
    if (!reqUser) {
      throw new HttpException("User not found.", HttpStatus.BAD_REQUEST);
    }

    const checkUserIsOrganizationOwner = await this.organizationModel
      .findOne({ _id: reqUser.organization })
      .exec();

    if (!checkUserIsOrganizationOwner) {
      throw new HttpException(
        "This user is not the owner of any organization",
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingUser = await this.userModel.findById(userId).exec();

    if (!existingUser) {
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    existingUser.name = name;
    existingUser.roles = roles;

    const userPermissions: Record<string, string> = {};

    if (roles.length > 0) {
      for (const roleId of roles) {
        const role = await this.rolesModel.findById(roleId).exec();

        if (role) {
          role.permissions.forEach((permission: any) => {
            const { category, read, write } = permission;

            if (!(category in userPermissions)) {
              userPermissions[category] = "";
            }

            if (read && !userPermissions[category].includes("r")) {
              userPermissions[category] += "r";
            }

            if (write && !userPermissions[category].includes("w")) {
              userPermissions[category] += "w";
            }
          });
        }
      }
    }

    existingUser.organization = reqUser.organization;
    existingUser.updated_by = reqUser?._id as MongooseSchema.Types.ObjectId;
    existingUser.permissions = userPermissions;

    const datasave = await existingUser.save();

    if (!datasave) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return datasave;
  }

  async active(id: string): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();
  }

  async deactivate(id: string): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, { isDeleted: false }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<any> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateToi(uid: string, transport: Record<string, any>): Promise<any> {
    const result = await this.userModel
      .updateOne(
        { _id: uid, "toi.transportId": { $ne: transport[0] } },
        { $push: { toi: { transportId: transport[0] } } },
      )
      .exec();

    if (result.modifiedCount === 0) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return { success: true, message: "Transport added successfully" };
  }

  async selectedTransport(
    uid: string,
    transport: Record<string, any>,
    isSelected: boolean,
  ): Promise<any> {
    await this.userModel
      .updateOne(
        { _id: uid, "toi.transportId": transport[0] },
        { $set: { "toi.$.isSelected": isSelected } },
      )
      .exec();

    return { success: true, message: "Transport selected successfully" };
  }

  async assignAlert(
    uid: string,
    transport: any,
    alertIds: string[],
  ): Promise<void> {
    try {
      const objectIdAlertIds = alertIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      await this.userModel.updateOne(
        {
          _id: uid,
          toi: {
            $elemMatch: {
              transportId: transport,
            },
          },
        },
        {
          $addToSet: {
            "toi.$.alerts": {
              $each: objectIdAlertIds.map((alertId) => ({
                alertId,
                status: false,
              })),
            },
          },
        },
      );
    } catch (error) {
      console.error("Error updating toi:", error);
      throw new Error(`An error occurred while updating toi: ${error.message}`);
    }
  }

  async assignGeofence(
    uid: string,
    transport: string,
    geoId: string[],
  ): Promise<any> {
    const ObjectId = geoId.map((id) => new mongoose.Types.ObjectId(id));

    const geoDetails = await this.geoModel.find({ _id: { $in: ObjectId } });

    const alertsToAdd = geoDetails
      .map((geo) => {
        return geo.alerts.map((alertId) => ({
          alertId,
          status: false,
        }));
      })
      .flat();

    await this.userModel.updateOne(
      {
        _id: uid,
        toi: {
          $elemMatch: {
            transportId: transport,
            "geofences.geoId": { $nin: ObjectId },
          },
        },
      },
      {
        $addToSet: {
          "toi.$.geofences": {
            $each: ObjectId.map((id) => ({
              geoId: id,
              isEnter: false,
              geoAlerts: alertsToAdd,
            })),
          },
        },
      },
    );

    return { success: true, message: "Geofence assigned successfully" };
  }

  async removeFromToi(uid: string, transportId: string): Promise<any> {
    const result = await this.userModel
      .updateOne(
        { _id: uid, "toi._id": transportId },
        { $pull: { toi: { _id: transportId } } },
      )
      .exec();

    if (result.modifiedCount === 0) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return { success: true, message: "remove successfully" };
  }

  async removeAlertFromToi(
    uid: string,
    transportId: string,
    alertId: string,
  ): Promise<any> {
    const result = await this.userModel
      .updateOne(
        { _id: uid, "toi._id": transportId },
        { $pull: { "toi.$.alerts": { alertId: alertId } } },
      )
      .exec();

    if (result.modifiedCount === 0) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return { success: true, message: "Alert removed successfully" };
  }

  async removeGeofenceFromToi(
    uid: string,
    transportId: string,
    geoId: string,
  ): Promise<any> {
    const result = await this.userModel
      .updateOne(
        { _id: uid, "toi._id": transportId },
        { $pull: { "toi.$.geofences": { geoId: geoId } } },
      )
      .exec();

    if (result.modifiedCount === 0) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return { success: true, message: "Geofence removed successfully" };
  }

  async updateFilterField(
    userId: string,
    hiddenColumns: string[],
    visibleColumnsOrder: string[],
  ): Promise<User | null> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    const Data = await this.userModel.findByIdAndUpdate(
      user._id,
      {
        hiddenColumns: hiddenColumns,
        visibleColumnsOrder: visibleColumnsOrder,
      },
      { new: true },
    );
    if (!Data) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return Data;
  }

  async getFilterField(uid: any): Promise<User | null> {
    console.log(uid);
    const UserData = await this.userModel.findById(uid).exec();

    if (!UserData) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return UserData;
  }
}
