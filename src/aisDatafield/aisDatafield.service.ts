import { getModelToken } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AisDataField } from "./aisDataField.model";

@Injectable()
export class AisDataFiledService {
  constructor(
    @InjectModel(AisDataField.name)
    private readonly aisDataModel: Model<AisDataField>,
  ) {}

  async create(data: AisDataField): Promise<AisDataField | null> {
    const existingField = await this.aisDataModel.findOne({
      fieldName: data.fieldName,
    });

    if (existingField) {
      return null;
    }
    const createdField = new this.aisDataModel(data);
    const savedField = await createdField.save();

    return savedField;
  }

  async findAll(): Promise<AisDataField[]> {
    return this.aisDataModel.find({ isActive: true }).exec();
  }

  async findCustomeAll(): Promise<AisDataField[]> {
    return this.aisDataModel.find({ isActive: true, fromAIS: false }).exec();
  }

  async findById(id: string): Promise<AisDataField> {
    return this.aisDataModel.findById(id).exec();
  }

  async update(id: string, data: AisDataField): Promise<AisDataField> {
    return this.aisDataModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async active(id: string): Promise<AisDataField> {
    return this.aisDataModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .exec();
  }

  async deactivate(id: string): Promise<AisDataField> {
    return this.aisDataModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<any> {
    return this.aisDataModel.findByIdAndDelete(id).exec();
  }

  async getAllDataFileds(options: {
    page: number;
    pageSize: number;
    fieldName: string;
  }): Promise<{ total: number; data: AisDataField[] }> {
    const { page, pageSize, fieldName } = options;
    const skip = (page - 1) * pageSize;
    const query = fieldName
      ? { fieldName: { $regex: new RegExp(fieldName, "i") } }
      : {};
    const data = await this.aisDataModel
      .find(query)
      .skip(skip)
      .limit(pageSize)
      .exec();

    const total = await this.aisDataModel.countDocuments(query);

    return { total, data };
  }
}
