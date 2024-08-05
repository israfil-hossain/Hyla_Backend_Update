import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { Port, PortDocument } from "./port.model";

@Injectable()
export class PortService {
  constructor(
    @InjectModel(Port.name) private readonly PortModel: Model<PortDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(uid: string, Port: Port): Promise<any> {
    const reqUser = await this.userModel.findOne({ idp_id: uid }).exec();

    if (!reqUser) {
      throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
    }

    // Port.created_by = reqUser?._id;
    Port.created_by = reqUser._id as Types.ObjectId;

    const newPort = new this.PortModel(Port);

    const createdPort = await newPort.save();

    if (!createdPort) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return createdPort;
  }

  async findAll(): Promise<any> {
    return this.PortModel.find({ isActive: true }).exec();
  }

  async getAllPort(options: {
    page: number;
    pageSize: number;
    name: string;
  }): Promise<{ total: number; data: Port[] }> {
    const { page, pageSize, name } = options;
    const skip = (page - 1) * pageSize;
    const query = name ? { name: { $regex: new RegExp(name, "i") } } : {};
    const data = await this.PortModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .exec();

    const total = await this.PortModel.countDocuments(query);

    return { total, data };
  }

  async findById(id: string): Promise<Port> {
    return this.PortModel.findById(id).exec();
  }

  async update(id: string, Port: Port): Promise<Port> {
    const dataUpdate = this.PortModel.findByIdAndUpdate(id, Port, {
      new: true,
    }).exec();

    if (!dataUpdate) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return dataUpdate;
  }

  async active(id: string): Promise<any> {
    return this.PortModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    ).exec();
  }

  async deactivate(id: string): Promise<any> {
    return this.PortModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).exec();
  }

  async delete(id: string): Promise<any> {
    return this.PortModel.findByIdAndDelete(id).exec();
  }
}
