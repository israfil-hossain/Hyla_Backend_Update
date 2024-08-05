// organization.service.ts
import { faker } from "@faker-js/faker";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model } from "mongoose";
import {
  TrackableTransport,
  TrackableTransportDocument,
} from "src/Trackable_Transport/trackable_transport.model";
import { Bucket, BucketDocument } from "src/bucket/bucket.model";
import { MailerService } from "src/mail/mailer.service";
import { Roles, RolesDocument } from "src/roles/roles.model";
import { Voyage, VoyageDocument } from "src/voyage/voyage.model";
import { User, UserDocument } from "../user/user.model";
import { CreateOrganizationDto } from "./dto/organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { Organization, OrganizationDocument } from "./organization.model";

interface PaginatedOrganizations {
  organizations: Organization[];
  totalCount: number;
}

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Roles.name) private readonly rolesModel: Model<RolesDocument>,
    @InjectModel(Voyage.name)
    private readonly voyageModel: Model<VoyageDocument>,
    @InjectModel(Bucket.name)
    private readonly bucketModel: Model<BucketDocument>,
    @InjectModel(TrackableTransport.name)
    private trackableTransportModel: Model<TrackableTransportDocument>,
    private readonly mailerService: MailerService,
  ) {}

  async fetchDataFromAIS(imo: any): Promise<any> {
    // vtexplorer api url
    const apiUrl = `${process.env.VT_URL}vessels?userkey=${process.env.VT_USER_KEY}&imo=${imo}&sat=1`; // ENV
    try {
      const response = await axios.get(apiUrl);

      if (response.status === 200) {
        return response.data;
      } else {
        console.error("data:", response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error fetching data:", error.response);
      } else {
        console.error("Error fetching data:", error.message);
      }
    }
  }

  private generateFakeAISData(imo: number) {
    return {
      MMSI: faker.number.int(),
      TIMESTAMP: new Date().toISOString(),
      LATITUDE: faker.location.latitude(),
      LONGITUDE: faker.location.longitude(),
      COURSE: faker.number.int({ min: 0, max: 360 }),
      SPEED: faker.number.float({ min: 0, max: 20, precision: 1 }),
      HEADING: faker.number.int({ min: 0, max: 360 }),
      NAVSTAT: faker.number.int(),
      IMO: imo,
      NAME: faker.person.fullName(),
      CALLSIGN: faker.string.alphanumeric(),
      TYPE: faker.number.int(),
      A: faker.number.int(),
      B: faker.number.int(),
      C: faker.number.int(),
      D: faker.number.int(),
      DRAUGHT: faker.number.float({ min: 0, max: 15, precision: 1 }),
      DESTINATION: faker.location.city(),
      LOCODE: faker.location.countryCode(),
      ETA_AIS: faker.date.future().toISOString(),
      ETA: faker.date.future().toISOString(),
      SRC: faker.string.alpha(),
      ZONE: faker.location.county(),
      ECA: faker.datatype.boolean(),
      DISTANCE_REMAINING: faker.number.int({ min: 0, max: 1000 }),
      ETA_PREDICTED: faker.date.future().toISOString(),
    };
  }

  async create(
    uid: string,
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const { name, ownerName, email, password } = createOrganizationDto;

    const reqUser = await this.userModel.findById(uid).exec();

    if (!reqUser) {
      throw new HttpException("User Not Found.", HttpStatus.BAD_REQUEST);
    }

    const existingOrganization = await this.organizationModel
      .findOne({ $or: [{ name }] })
      .exec();

    if (existingOrganization) {
      throw new HttpException(
        "Organization name already exists",
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingEmailInDb = await this.userModel.findOne({ email }).exec();

    if (existingEmailInDb) {
      throw new HttpException(
        "This user already exists.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const userPermissions: Record<string, string> = {};
    const roles = ["656eb5478db27e4db5b1b4c0"];

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

    const user = new this.userModel({
      name: ownerName,
      email,
      created_by: reqUser?._id,
      roles,
      isOrganizationOwner: true,
      permissions: userPermissions,
    });

    // const createdUser = await user.save();
    const createdUser = (await user.save()) as User & { _id: string }; // Type assertion

    if (!createdUser) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    createOrganizationDto.owner_id = createdUser._id;
    createOrganizationDto.created_by = reqUser._id.toString();

    const createdOrganization = new this.organizationModel(
      createOrganizationDto,
    );

    if (createOrganizationDto) {
      await this.userModel.findByIdAndUpdate(createdUser._id, {
        organization: createdOrganization._id,
      });
    }

    const savedOrganization = await createdOrganization.save();

    if (!savedOrganization) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.mailerService.sendWelcomeEmailToOrganization(
      email,
      name,
      ownerName,
      password,
    );

    return savedOrganization;
  }

  async findAll(query: any): Promise<PaginatedOrganizations> {
    try {
      const { name, page, pageSize } = query;

      // console.log('Received query:', query);
      const parsedPage = parseInt(page);
      const parsedPageSize = parseInt(pageSize);

      // console.log('Parsed page:', parsedPage);
      // console.log('Parsed pageSize:', parsedPageSize);
      if (
        isNaN(parsedPage) ||
        isNaN(parsedPageSize) ||
        parsedPage < 1 ||
        parsedPageSize < 1
      ) {
        throw new BadRequestException("Invalid page or pageSize values.");
      }

      const filter: any = {};
      if (name) {
        filter.name = new RegExp(name, "i");
      }

      const totalCount = await this.organizationModel.countDocuments(filter);

      const organizations = await this.organizationModel
        .find(filter)
        .skip((parsedPage - 1) * parsedPageSize)
        .limit(parsedPageSize)
        .exec();

      return { organizations, totalCount };
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

  async getAll(): Promise<Organization[]> {
    return this.organizationModel.find().exec();
  }

  async findByIdWithUser(id: string): Promise<Organization> {
    try {
      const organization = await this.organizationModel
        .findById(id)
        .populate("owner_id")
        .populate("transports")
        .exec();

      if (!organization) {
        throw new NotFoundException("Organization not found");
      }

      return organization;
    } catch (error) {
      throw new InternalServerErrorException(
        `Internal server error occurred while fetching organization by ID: ${id}`,
        error.message,
      );
    }
  }

  async updateOrg(id: string, updateDto: UpdateOrganizationDto): Promise<any> {
    const existingOrganization = await this.organizationModel
      .findById(id)
      .exec();

    if (!existingOrganization) {
      throw new HttpException(
        "Organization not found.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (updateDto.transports && updateDto.transports.length > 0) {
      await Promise.all(
        updateDto.transports.map(async (transportId: any) => {
          const transport = await this.trackableTransportModel
            .findById(transportId)
            .exec();

          if (!transport) {
            throw new HttpException(
              `Transport with ID ${transportId} not found.`,
              HttpStatus.BAD_REQUEST,
            );
          }
          const currentTime = new Date();
          const checkBucketData = await this.bucketModel.findOne({
            transport_id: transport._id,
            start_date: { $lt: currentTime },
            end_date: { $gte: currentTime },
          });

          if (checkBucketData) {
            console.log("This transport is existing in bucket");
          } else {
            let Data;
            if (process.env.MODE === "faker") {
              const aisFakeData = this.generateFakeAISData(transport.imoNumber);
              Data = Array.isArray(aisFakeData) ? aisFakeData : [aisFakeData];
            } else {
              const aisData = await this.fetchDataFromAIS(transport.imoNumber);

              Data = aisData.map((item: any) => ({
                MMSI: item.AIS.MMSI,
                TIMESTAMP: item.AIS.TIMESTAMP,
                LATITUDE: item.AIS.LATITUDE,
                LONGITUDE: item.AIS.LONGITUDE,
                COURSE: item.AIS.COURSE,
                SPEED: item.AIS.SPEED,
                HEADING: item.AIS.HEADING,
                NAVSTAT: item.AIS.NAVSTAT,
                IMO: item.AIS.IMO,
                NAME: item.AIS.NAME,
                CALLSIGN: item.AIS.CALLSIGN,
                TYPE: item.AIS.TYPE,
                A: item.AIS.A,
                B: item.AIS.B,
                C: item.AIS.C,
                D: item.AIS.D,
                DRAUGHT: item.AIS.DRAUGHT,
                DESTINATION: item.AIS.DESTINATION,
                LOCODE: item.AIS.LOCODE,
                ETA_AIS: item.AIS.ETA_AIS,
                ETA: item.AIS.ETA,
                SRC: item.AIS.SRC,
                ZONE: item.AIS.ZONE,
                ECA: item.AIS.ECA,
                DISTANCE_REMAINING: item.AIS.DISTANCE_REMAINING,
                ETA_PREDICTED: item.AIS.ETA_PREDICTED,
              }));
            }

            const startTimeStamp = Date.now();
            const endTimeStamp =
              startTimeStamp + parseInt(process.env.BucketTime) * 60 * 1000;
            const bucketData: Partial<any> = {
              transport_id: transport._id,
              start_date: new Date(startTimeStamp),
              end_date: new Date(endTimeStamp),
              AISDataObject: Data,
              total_entries: Data.length,
            };
            const createdBucket = new this.bucketModel(bucketData);
            await createdBucket.save();
          }
        }),
      );
    }

    existingOrganization.name = updateDto.name;

    existingOrganization.transports = updateDto.transports;

    const dataUpdate = await existingOrganization.save();

    const usersWithToi = await this.userModel.find({
      organization: id,
      toi: { $exists: true, $ne: [] },
    });

    await Promise.all(
      usersWithToi.map(async (user: any) => {
        const updatedToi = user.toi.filter((transportObj: any) =>
          updateDto.transports.includes(transportObj.transportId.toString()),
        );
        user.toi = updatedToi;
        await user.save();
      }),
    );

    const voyageData = await this.voyageModel.find({ orgId: id });

    await Promise.all(
      voyageData.map(async (voyage) => {
        const transportId = voyage.transport.toString();
        if (!updateDto.transports.includes(transportId)) {
          await this.voyageModel.deleteOne({ _id: voyage._id });
        }
      }),
    );

    if (!dataUpdate) {
      throw new HttpException(
        "Oops!! Something went wrong. Please retry.",
        HttpStatus.BAD_REQUEST,
      );
    }
    return dataUpdate;
  }
}
