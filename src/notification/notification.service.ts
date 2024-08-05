import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { Notification, NotificationDocument } from "./notification.model";

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private Model: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getAllUnreadNotification(uid: string): Promise<any> {
    const reqUser = await this.userModel.findById(uid).exec();
    const data = await this.Model.find({ userId: reqUser?._id, isRead: false })
      .sort({ createdAt: -1 })
      .exec();
    return data;
  }

  async UnreadNotification(uid: string): Promise<any> {
    const reqUser = await this.userModel.findById(uid).exec();
    await this.Model.updateMany(
      { userId: reqUser?._id, isRead: false },
      { $set: { isRead: true } },
    ).exec();
    const data = await this.Model.find({
      userId: reqUser?._id,
      isRead: false,
    }).exec();
    return data;
  }

  async findAll(uid: string): Promise<any> {
    const reqUser = await this.userModel.findById(uid).exec();
    const data = await this.Model.find({ userId: reqUser?._id })
      .sort({ createdAt: -1 })
      .exec();
    return data;
  }

  async findById(id: string): Promise<any> {
    const data = await this.Model.findById(id).exec();
    if (!data) {
      throw new NotFoundException("Data not found");
    }
    return data;
  }

  async remove(id: string): Promise<any> {
    const deleteNotification = await this.Model.findByIdAndDelete(id)
      .lean()
      .exec();

    if (!deleteNotification) {
      throw new NotFoundException("Data not found");
    }

    return deleteNotification as Notification;
  }
}
