import { Injectable } from "@nestjs/common";
import { Bucket, BucketDocument } from "./bucket/bucket.model";
import { OrganizationService } from "./organization/organization.service";
// import * as turf from '@turf/turf';

import {
  Organization,
  OrganizationDocument,
} from "src/organization/organization.model";
import {
  TrackableTransport,
  TrackableTransportDocument,
} from "./Trackable_Transport/trackable_transport.model";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User, UserDocument } from "./user/user.model";
import { Alert } from "./alert/alert.model";
import { MailerService } from "./mail/mailer.service";

import { Geofence, GeofenceDocument } from "./geoFence/geofence.model";
import {
  Notification,
  NotificationDocument,
} from "./notification/notification.model";
@Injectable()
export class AppService {
  constructor(
    @InjectModel(Bucket.name)
    private readonly bucketModel: Model<BucketDocument>,
    @InjectModel(TrackableTransport.name)
    private readonly tModel: Model<TrackableTransportDocument>,
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(Notification.name)
    private readonly NotificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Alert.name) private readonly alertModel: Model<Alert>,
    private readonly mailerService: MailerService,
  ) {}

  getHello(): string {
    return "Hello World!";
  }

  // comman function
  async sendAlertEmail(user: any, transport: any, message: any): Promise<void> {
    const transportName = transport.transportName;
    const imoNumber = transport.imoNumber;

    try {
      await this.mailerService.sendAlertEmail(
        user.email,
        transportName,
        imoNumber,
        message,
      );
    } catch (error) {
      console.error("Error sending alert email:", error);
    }
  }

  async sendAlertsToToiUsers(): Promise<void> {
    try {
      const usersWithAlerts = await this.userModel
        .find({ isSuperUser: false })
        .populate("toi.transportId");
      const currentTime = new Date();
      let alertOnEmail;
      let alertOnNotification;
      for (const user of usersWithAlerts) {
        if (user.toi.length > 0) {
          for (const transport of user.toi) {
            for (const x of transport.alerts) {
              if (x.alertId) {
                const alertDetails = await this.getAlertDetails(x.alertId);
                alertOnEmail = alertDetails?.alertOnEmail || false;
                alertOnNotification =
                  alertDetails?.alertOnNotification || false;
                for (const criteria of alertDetails?.criteria) {
                  const bucket = await this.bucketModel
                    .findOne({
                      transport_id: transport.transportId,
                      start_date: { $lt: currentTime },
                      end_date: { $gte: currentTime },
                    })
                    .populate("transport_id")
                    .exec();

                  if (!bucket || !bucket.AISDataObject) {
                    // console.log(
                    //   "AISDataObject not found in the bucket or bucket is null",
                    // );
                    return;
                  }
                  const latestAISData = bucket.AISDataObject.reduce(
                    (latest, current) =>
                      new Date(current.TIMESTAMP) > new Date(latest.TIMESTAMP)
                        ? current
                        : latest,
                  );

                  if (bucket.customData && bucket.customData.length > 0) {
                    for (const data of bucket.customData) {
                      latestAISData[data.fieldName] = data.value;
                    }
                  }
                  this.compareCriteriaWithAISData(
                    criteria,
                    latestAISData,
                    user,
                    transport.transportId,
                    transport,
                    x.alertId,
                    user.toi,
                    alertOnNotification,
                    alertOnEmail,
                  );
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending alerts:", error.message);
    }
  }

  async compareCriteriaWithAISData(
    criteria: any,
    latestAISData: any,
    user: any,
    transportId: any,
    transportData: any,
    alertId: any,
    toi: any,
    alertOnNotification: any,
    alertOnEmail: any,
  ): Promise<void> {
    const { fieldName, value, condition } = criteria;
    const latestAISDataValue = latestAISData[fieldName];
    let message: any;
    const transport = toi.find((t: any) => t.transportId === transportId);

    if (!transport) {
      console.log(`Transport not found`);
      return;
    }

    const alert = transport.alerts.find((a: any) => a.alertId === alertId);

    const conditionsMap: Record<string, () => void> = {
      notEqual: () => {
        if (alert && alert.status === false) {
          console.log(`AlertId ${alertId} status false.`);
          if (latestAISDataValue != value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is not equal to ${value}.`;
            this.sendAlertAndTrigger(
              user,
              message,
              transportId,
              alertId,
              alertOnEmail,
              alertOnNotification,
            );
          } else {
            console.log("is triggered");
          }
        } else {
          if (latestAISDataValue != value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AlertOn(user._id, transportId, alertId);
          }
        }
      },
      equal: () => {
        if (alert && alert.status === false) {
          console.log(`AlertId ${alertId} status false.`);
          if (latestAISDataValue == value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is equal to ${value}.`;
            this.sendAlertAndTrigger(
              user,
              message,
              transportId,
              alertId,
              alertOnEmail,
              alertOnNotification,
            );
          } else {
            console.log("is triggered");
          }
        } else {
          if (latestAISDataValue == value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AlertOn(user._id, transportId, alertId);
          }
        }
      },
      greaterThan: () => {
        if (alert && alert.status === false) {
          console.log(`AlertId ${alertId} status false.`);
          if (latestAISDataValue > value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is greater than ${value}.`;
            this.sendAlertAndTrigger(
              user,
              message,
              transportId,
              alertId,
              alertOnEmail,
              alertOnNotification,
            );
          } else {
            console.log("is triggered");
          }
        } else {
          if (latestAISDataValue > value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AlertOn(user._id, transportId, alertId);
          }
        }
      },
      greaterThanOrEqual: () => {
        if (alert && alert.status === false) {
          console.log(`AlertId ${alertId} status false.`);
          if (latestAISDataValue >= value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is greater than or equal to ${value}.`;
            this.sendAlertAndTrigger(
              user,
              message,
              transportId,
              alertId,
              alertOnEmail,
              alertOnNotification,
            );
          } else {
            console.log("is triggered");
          }
        } else {
          if (latestAISDataValue >= value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AlertOn(user._id, transportId, alertId);
          }
        }
      },
      lessThan: () => {
        if (alert && alert.status === false) {
          console.log(`AlertId ${alertId} status false.`);
          if (latestAISDataValue < value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is less than ${value}.`;
            this.sendAlertAndTrigger(
              user,
              message,
              transportId,
              alertId,
              alertOnEmail,
              alertOnNotification,
            );
          } else {
            console.log("is triggered");
          }
        } else {
          if (latestAISDataValue < value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AlertOn(user._id, transportId, alertId);
          }
        }
      },
      lessThanOrEqual: () => {
        if (alert && alert.status === false) {
          console.log(`AlertId ${alertId} status false.`);
          if (latestAISDataValue <= value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is less than or equal to ${value}.`;
            this.sendAlertAndTrigger(
              user,
              message,
              transportId,
              alertId,
              alertOnEmail,
              alertOnNotification,
            );
          } else {
            console.log("is triggered");
          }
        } else {
          if (latestAISDataValue <= value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AlertOn(user._id, transportId, alertId);
          }
        }
      },
    };

    if (conditionsMap[condition]) {
      conditionsMap[condition]();
    } else {
      console.log("Unsupported condition:", condition);
    }
  }

  async sendAlertAndTrigger(
    user: any,
    message: any,
    transportId: any,
    alertId: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    if (alertOnEmail) {
      this.sendAlertEmail(user, transportId, message);
    }

    this.AlertOff(user._id, transportId, alertId);

    if (alertOnNotification) {
      const type = "Alert Notification";
      this.createNotification(user._id, transportId, message, type);
    }
  }

  async AlertOff(
    uid: string,
    transport: Record<string, any>,
    alertId: string,
  ): Promise<void> {
    try {
      const result = await this.userModel.updateOne(
        {
          _id: uid,
          toi: {
            $elemMatch: {
              transportId: transport,
              "alerts.alertId": {
                $in: alertId,
              },
            },
          },
        },
        {
          $set: {
            "toi.$[elem].alerts.$[innerElem].status": true,
          },
        },
        {
          arrayFilters: [
            { "elem.transportId": transport },
            { "innerElem.alertId": { $in: alertId } },
          ],
        },
      );
    } catch (error) {
      console.error("Error updating toi:", error);
      throw new Error(`An error occurred while updating toi: ${error.message}`);
    }
  }

  async AlertOn(
    uid: string,
    transport: Record<string, any>,
    alertId: string,
  ): Promise<void> {
    try {
      const result = await this.userModel.updateOne(
        {
          _id: uid,
          toi: {
            $elemMatch: {
              transportId: transport,
              "alerts.alertId": {
                $in: alertId,
              },
            },
          },
        },
        {
          $set: {
            "toi.$[elem].alerts.$[innerElem].status": false,
          },
        },
        {
          arrayFilters: [
            { "elem.transportId": transport },
            { "innerElem.alertId": { $in: alertId } },
          ],
        },
      );
    } catch (error) {
      console.error("Error updating toi:", error);
      throw new Error(`An error occurred while updating toi: ${error.message}`);
    }
  }

  async createNotification(
    userId: string,
    transport_id: any,
    message: string,
    type: string,
  ) {
    try {
      const transportName = transport_id.transportName;
      const imoNumber = transport_id.imoNumber;
      const notification = await this.NotificationModel.create({
        title: "Alert Notification",
        message,
        type,
        transportName,
        imoNumber,
        userId,
        isRead: false,
      });

      if (!notification) {
        console.log(`failed`);
      }
    } catch (error) {
      console.error("Error creating and sending notification:", error);
      throw error;
    }
  }

  //-------------------------------------- END ------------------------------------ //

  async getAlertDetails(alertsIds: any): Promise<any> {
    try {
      const alertsDetails = await this.alertModel.findOne({
        _id: { $in: alertsIds },
      });

      return alertsDetails;
    } catch (error) {
      console.error("Error fetching alert details:", error);
      throw new Error("Error fetching alert details");
    }
  }
}
