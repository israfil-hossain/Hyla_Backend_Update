import { Injectable } from "@nestjs/common";
import { Bucket, BucketDocument } from "./bucket/bucket.model";
import * as turf from "@turf/turf";

import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User, UserDocument } from "./user/user.model";
// import { Alert } from "./alert/alert.model";
import { MailerService } from "./mail/mailer.service";

import { Geofence, GeofenceDocument } from "./geoFence/geofence.model";

import {
  Notification,
  NotificationDocument,
} from "./notification/notification.model";

@Injectable()
export class GeoFencesAlertService {
  constructor(
    @InjectModel(Bucket.name)
    private readonly bucketModel: Model<BucketDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Geofence.name) private geofenceModel: Model<GeofenceDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly mailerService: MailerService,
  ) {}

  async getGeofenceAlertDetails(geoIds: any): Promise<any[]> {
    try {
      const data = await this.geofenceModel
        .find({
          _id: { $in: geoIds },
        })
        .populate("alerts");

      return data;
    } catch (error) {
      console.error("Error fetching  details:", error);
      throw new Error("Error fetching details");
    }
  }

  async sendGeofenceAlertsToToiUsers(): Promise<void> {
    try {
      const usersWithGeoAlerts = await this.userModel
        .find({ isSuperUser: false })
        .populate("toi.transportId");

      const currentTime = new Date();

      await Promise.all(
        usersWithGeoAlerts.map(async (user) => {
          if (user.toi.length === 0) return;

          await Promise.all(
            user.toi.map(async (transport) => {
              if (
                !transport ||
                !transport.geofences ||
                transport.geofences.length === 0
              )
                return;

              await Promise.all(
                transport.geofences.map(async (geo) => {
                  const geoFenceDetails = await this.getGeofenceAlertDetails(
                    geo.geoId,
                  );

                  for (const geofence of geoFenceDetails) {
                    const alertOnEmail = geofence?.alertOnEmail || false;
                    const alertOnNotification =
                      geofence?.alertOnNotification || false;
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

                    const coordinates = geofence.geometry.coordinates[0];
                    const isInsideGeofence = this.isInsideGeofence(
                      latestAISData.LATITUDE,
                      latestAISData.LONGITUDE,
                      coordinates,
                    );

                    if (isInsideGeofence) {
                      if (geo.isEnter === false) {
                        await this.TransportEntryINGeoFence(
                          user,
                          transport,
                          geo.geoId,
                          geofence,
                          alertOnEmail,
                          alertOnNotification,
                        );
                      }
                      await this.handleGeoAlerts(
                        geofence,
                        latestAISData,
                        user,
                        transport,
                        geo,
                      );
                    } else {
                      if (geo.isEnter === true) {
                        await this.TransportExistINGeoFence(
                          user,
                          transport,
                          geo.geoId,
                          geofence,
                          alertOnEmail,
                          alertOnNotification,
                        );
                      }
                    }
                  }
                }),
              );
            }),
          );
        }),
      );
    } catch (error) {
      console.error("Error sending alerts:", error.message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleGeoAlerts(geofence, latestAISData, user, transport, geo) {
    let alertOnEmail;
    let alertOnNotification;
    if (geofence.alerts.length > 0) {
      for (const alert of geofence.alerts) {
        alertOnEmail = alert?.alertOnEmail || false;
        alertOnNotification = alert?.alertOnNotification || false;
        for (const criteria of alert?.criteria) {
          this.compareGeoAlertCriteriaWithAISData(
            criteria,
            latestAISData,
            user,
            user._id,
            transport.transportId,
            transport,
            alert,
            geofence,
            user.toi,
            alertOnEmail,
            alertOnNotification,
          );
        }
      }
    } else {
      console.log("This geofence does not have any alerts.");
    }
  }

  private isInsideGeofence(
    latitude: number,
    longitude: number,
    coordinates: number[][],
  ): boolean {
    const point = turf.point([longitude, latitude]);
    const polygon = turf.polygon([coordinates]);

    return turf.booleanPointInPolygon(point, polygon);
  }

  async TransportEntryINGeoFence(
    user: any,
    transport: any,
    geoId: any,
    geoFenceData: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    const transportName =
      transport?.transportId?.transportName || transport?.transportName;
    const message = `This transport: ${transportName} has entered the geofence:  ${geoFenceData.name}`;

    if (alertOnEmail) {
      this.sendGeoEntryAlertEmail(user, transport, message);
    }
    if (alertOnNotification) {
      const type = "Geofence Alert Notification";
      this.createNotification(user._id, message, transportName, type);
    }

    this.markGeoEntry(
      user._id,
      transport?.transportId?._id || transport?._id,
      geoFenceData._id,
    );
  }

  async TransportExistINGeoFence(
    user: any,
    transport: any,
    geoId: any,
    geoFenceData: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    const transportName =
      transport?.transportId?.transportName || transport?.transportName;
    const message = `This transport: ${transportName} has exited the geofence:  ${geoFenceData.name}`;
    if (alertOnEmail) {
      this.sendGeoEntryAlertEmail(user, transport, message);
    }
    if (alertOnNotification) {
      const type = "Geofence Alert Notification";
      this.createNotification(user._id, message, transportName, type);
    }
    this.markGeoExist(
      user._id,
      transport?.transportId?._id || transport?._id,
      geoFenceData._id,
    );
  }

  async markGeoEntry(
    userId: string,
    transportId: string,
    geoId: string,
  ): Promise<void> {
    try {
      const result = await this.userModel.updateOne(
        {
          _id: userId,
          "toi.transportId": transportId,
          "toi.geofences.geoId": geoId,
        },
        {
          $set: {
            "toi.$.geofences.$[geoElem].isEnter": true,
          },
        },
        {
          arrayFilters: [
            {
              "geoElem.geoId": geoId,
            },
          ],
        },
      );

      if (result.matchedCount === 0) {
        console.log("No documents were modified.");
      } else {
        console.log("GeoEntry marked as true successfully.");
      }
    } catch (error) {
      console.error("Error marking GeoEntry as true:", error);
      // Handle the error
    }
  }

  async markGeoExist(
    userId: string,
    transportId: string,
    geoId: string,
  ): Promise<void> {
    try {
      const result = await this.userModel.updateOne(
        {
          _id: userId,
          "toi.transportId": transportId,
          "toi.geofences.geoId": geoId,
        },
        {
          $set: {
            "toi.$.geofences.$[geoElem].isEnter": false,
          },
        },
        {
          arrayFilters: [
            {
              "geoElem.geoId": geoId,
            },
          ],
        },
      );

      if (result.matchedCount === 0) {
        console.log("No documents were modified.");
      } else {
        console.log("GeoEntry marked as true successfully.");
      }
    } catch (error) {
      console.error("Error marking GeoEntry as true:", error);
      // Handle the error
    }
  }

  async compareGeoAlertCriteriaWithAISData(
    criteria: any,
    latestAISData: any,
    user: any,
    userId: any,
    transportId: any,
    transport: any,
    alerts: any,
    geofence: any,
    toi: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    const { fieldName, value, condition } = criteria;
    const latestAISDataValue = latestAISData[fieldName];
    let message: any;

    const transportData = toi.find((t: any) => t.transportId === transportId);

    if (!transportData) {
      console.log(`Transport not found`);
      return;
    }

    const existingGeoData = transportData.geofences.find((b: any) =>
      b.geoId.equals(geofence._id),
    );

    if (!existingGeoData) {
      console.log(`geofence not found`);
      return;
    }

    const alert = existingGeoData.geoAlerts.find((c: any) => {
      return c.alertId.equals(new mongoose.Types.ObjectId(alerts._id));
    });

    const conditionsMap: Record<string, () => void> = {
      notEqual: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue != value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is not equal to ${value}.`;
            this.sendGeoAlertAndTrigger(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.GeoAlertOn(
              user._id,
              transport?.transportId?._id || transport?._id,
              geofence._id,
              alerts._id,
            );
          }
        }
      },
      equal: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue == value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is equal to ${value}.`;
            this.sendGeoAlertAndTrigger(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.GeoAlertOn(
              user._id,
              transport?.transportId?._id || transport?._id,
              geofence._id,
              alerts._id,
            );
          }
        }
      },
      greaterThan: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue > value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is greater than ${value}.`;
            this.sendGeoAlertAndTrigger(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.GeoAlertOn(
              user._id,
              transport?.transportId?._id || transport?._id,
              geofence._id,
              alerts._id,
            );
          }
        }
      },
      greaterThanOrEqual: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue >= value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is greater than or equal to ${value}.`;
            this.sendGeoAlertAndTrigger(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.GeoAlertOn(
              user._id,
              transport?.transportId?._id || transport?._id,
              geofence._id,
              alerts._id,
            );
          }
        }
      },
      lessThan: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue < value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is less than ${value}.`;
            this.sendGeoAlertAndTrigger(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.GeoAlertOn(
              user._id,
              transport?.transportId?._id || transport?._id,
              geofence._id,
              alerts._id,
            );
          }
        }
      },
      lessThanOrEqual: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue <= value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is less than or equal to ${value}.`;
            this.sendGeoAlertAndTrigger(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.GeoAlertOn(
              user._id,
              transport?.transportId?._id || transport?._id,
              geofence._id,
              alerts._id,
            );
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

  async sendGeoAlertAndTrigger(
    user: any,
    transport: any,
    message: any,
    geoId: any,
    alertId: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    if (alertOnEmail) {
      this.sendAlertEmail(user, transport, message, geoId.name);
    }
    if (alertOnNotification) {
      const type = "Geofence Alert Notification";
      this.createNotification(user._id, message, transport, type);
    }

    this.GeoAlertOff(
      user._id,
      transport?.transportId?._id || transport?._id,
      geoId._id,
      alertId,
    );
  }

  async GeoAlertOff(
    uid: string,
    transportId: any,
    geoId: string,
    alertIds: string,
  ): Promise<void> {
    try {
      await this.userModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(uid),
          "toi.transportId": new mongoose.Types.ObjectId(transportId._id),
          "toi.geofences.geoId": new mongoose.Types.ObjectId(geoId),
          "toi.geofences.geoAlerts.alertId": { $in: alertIds },
        },
        {
          $set: {
            "toi.$.geofences.$[outerElem].geoAlerts.$[innerElem].status": true,
          },
        },
        {
          arrayFilters: [
            { "outerElem.geoId": new mongoose.Types.ObjectId(geoId) },
            { "innerElem.alertId": { $in: alertIds } },
          ],
        },
      );
    } catch (error) {
      console.error("Error updating toi:", error);
      throw new Error(`An error occurred while updating toi: ${error.message}`);
    }
  }

  async GeoAlertOn(
    uid: string,
    transportId: any,
    geoId: string,
    alertIds: string,
  ): Promise<void> {
    try {
      await this.userModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(uid),
          "toi.transportId": new mongoose.Types.ObjectId(transportId._id),
          "toi.geofences.geoId": new mongoose.Types.ObjectId(geoId),
          "toi.geofences.geoAlerts.alertId": { $in: alertIds },
        },
        {
          $set: {
            "toi.$.geofences.$[outerElem].geoAlerts.$[innerElem].status": false,
          },
        },
        {
          arrayFilters: [
            { "outerElem.geoId": new mongoose.Types.ObjectId(geoId) },
            { "innerElem.alertId": { $in: alertIds } },
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
    message: string,
    transport_id: any,
    type: string,
  ) {
    try {
      const transportName =
        transport_id?.transportId?.transportName || transport_id?.transportName;
      const imoNumber =
        transport_id?.transportId?.imoNumber || transport_id?.imoNumber;
      const notification = await this.notificationModel.create({
        title: "Geofence Alert Notification",
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

  // comman function
  async sendAlertEmail(
    user: any,
    transport: any,
    message: any,
    geofenceName: any,
  ): Promise<void> {
    const transportName =
      transport?.transportId?.transportName || transport?.transportName;
    const imoNumber = transport?.transportId?.imoNumber || transport?.imoNumber;
    try {
      await this.mailerService.sendGeoAlertEmail(
        user.email,
        transportName,
        imoNumber,
        message,
        geofenceName,
      );
    } catch (error) {
      console.error("Error sending alert email:", error);
    }
  }

  async sendGeoEntryAlertEmail(
    user: any,
    transport: any,
    message: any,
  ): Promise<void> {
    const transportName =
      transport?.transportId?.transportName || transport?.transportName;
    const imoNumber = transport?.transportId?.imoNumber || transport?.imoNumber;

    try {
      await this.mailerService.sendGeoFecneEntryAlertEmail(
        user.email,
        transportName,
        imoNumber,
        message,
      );
    } catch (error) {
      console.error("Error sending alert email:", error);
    }
  }

  //-------------------------- Actvie for ALL -----------------//

  async getActiveForAllGeoFences(userId: mongoose.Types.ObjectId) {
    const getActiveForAllGeo = await this.geofenceModel
      .find({
        created_by: userId,
        activeForAll: true,
      })
      .populate({
        path: "transports.transportId",
        model: "TrackableTransport",
      })
      .populate("alerts");
    return getActiveForAllGeo;
  }

  async ActiveForAllGeofenceForUserTransport() {
    try {
      // const users = await this.userModel.find({ isSuperUser: false });
      const users: UserDocument[] = await this.userModel.find({
        isSuperUser: false,
      });
      const currentTime = new Date();

      await Promise.all(
        users?.map(async (user) => {
          const activeGeoFences = await this.getActiveForAllGeoFences(
            user._id as mongoose.Types.ObjectId,
          );

          if (activeGeoFences.length === 0) {
            console.log("No active geofences for user:", user._id);
            return;
          }

          for (const geoId of activeGeoFences) {
            const alertOnEmail = geoId?.alertOnEmail || false;
            const alertOnNotification = geoId?.alertOnNotification || false;
            const coordinates = (
              geoId.geometry as unknown as { coordinates: any[] }
            ).coordinates[0];

            await Promise.all(
              geoId.transports.map(async (t) => {
                const bucket = await this.bucketModel
                  .findOne({
                    transport_id: t.transportId,
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

                const isInsideGeofence = this.isInsideGeofence(
                  latestAISData.LATITUDE,
                  latestAISData.LONGITUDE,
                  coordinates,
                );

                if (isInsideGeofence) {
                  if (t.isTrigger === false) {
                    await this.TransportEntryINAllActiveGeoFence(
                      user,
                      t.transportId,
                      geoId._id,
                      geoId,
                      alertOnEmail,
                      alertOnNotification,
                    );
                  }
                  await this.handleGeoAlerts2(
                    geoId,
                    latestAISData,
                    user,
                    t.transportId,
                  );
                } else {
                  if (t.isTrigger === true) {
                    return await this.TransportExsitINAllActiveGeoFence(
                      user,
                      t.transportId,
                      geoId._id,
                      geoId,
                      alertOnEmail,
                      alertOnNotification,
                    );
                  }
                }
              }),
            );
          }
        }),
      );
    } catch (error) {
      console.error(
        "Error in ActiveForAllGeofenceForUserTransport:",
        error.message,
      );
    }
  }

  async markIsTrigger(userId, transportId, geoId, isTrigger) {
    try {
      const result = await this.geofenceModel.updateOne(
        {
          created_by: userId,
          "transports.transportId": transportId,
          _id: geoId,
        },
        {
          $set: {
            "transports.$.isTrigger": isTrigger,
          },
        },
      );

      if (result.matchedCount === 0) {
        console.log("No documents were modified.");
      } else {
        console.log(`isTrigger marked as ${isTrigger} successfully.`);
      }
    } catch (error) {
      console.error(`Error marking isTrigger as ${isTrigger}:`, error);
      // Handle the error
    }
  }

  async TransportEntryINAllActiveGeoFence(
    user,
    transport,
    geoId,
    geoFenceData,
    alertOnEmail,
    alertOnNotification,
  ) {
    const transportName =
      transport?.transportId?.transportName || transport?.transportName;
    const message = `This transport: ${transportName} has entered the geofence:  ${geoFenceData.name}`;
    if (alertOnEmail) {
      await this.sendGeoEntryAlertEmail(user, transport, message);
    }

    if (alertOnNotification) {
      const type = "Geofence Alert Notification";
      this.createNotification(user._id, message, transport, type);
    }

    await this.markIsTrigger(
      user._id,
      transport?.transportId?._id || transport?._id,
      geoId,
      true,
    );
  }

  async TransportExsitINAllActiveGeoFence(
    user,
    transport,
    geoId,
    geoFenceData,
    alertOnEmail,
    alertOnNotification,
  ) {
    const transportName =
      transport?.transportId?.transportName || transport?.transportName;
    const message = `This transport: ${transportName} has exited the geofence:  ${geoFenceData.name}`;
    if (alertOnEmail) {
      await this.sendGeoEntryAlertEmail(user, transport, message);
    }

    if (alertOnNotification) {
      const type = "Geofence Alert Notification";
      this.createNotification(user._id, message, transport, type);
    }
    await this.markIsTrigger(
      user._id,
      transport?.transportId?._id || transport?._id,
      geoId,
      false,
    );
  }

  async compareActiveForALlGeoAlertCriteriaWithAISData(
    criteria: any,
    latestAISData: any,
    user: any,
    transportId: any,
    alerts: any,
    alertId: any,
    geofence: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    const { fieldName, value, condition } = criteria;
    const latestAISDataValue = latestAISData[fieldName];
    let message: any;

    const transportData = geofence.transports.find(
      (t: any) => t.transportId._id === transportId?._id,
    );

    if (!transportData) {
      console.log(`Transport not found`);
      return;
    }
    const alert = transportData.alerts.find((c: any) => {
      return c.alertId.equals(new mongoose.Types.ObjectId(alertId));
    });

    const conditionsMap: Record<string, () => void> = {
      notEqual: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue != value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is not equal to ${value}.`;
            this.sendGeoAlertAndTrigger_2(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
              alertOnEmail,
              alertOnNotification,
            );
          }
        } else {
          if (latestAISDataValue != value) {
            console.log("condition true");
          } else {
            console.log("condition false");
            this.AllGeoAlertON(
              user._id,
              transportId._id,
              geofence._id,
              alertId,
            );
          }
        }
      },
      equal: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue == value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is equal to ${value}.`;
            this.sendGeoAlertAndTrigger_2(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.AllGeoAlertON(
              user._id,
              transportId._id,
              geofence._id,
              alertId,
            );
          }
        }
      },
      greaterThan: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue > value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is greater than ${value}.`;
            this.sendGeoAlertAndTrigger_2(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.AllGeoAlertON(
              user._id,
              transportId._id,
              geofence._id,
              alertId,
            );
          }
        }
      },
      greaterThanOrEqual: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue >= value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is greater than or equal to ${value}.`;
            this.sendGeoAlertAndTrigger_2(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.AllGeoAlertON(
              user._id,
              transportId._id,
              geofence._id,
              alertId,
            );
          }
        }
      },
      lessThan: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue < value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is less than ${value}.`;
            this.sendGeoAlertAndTrigger_2(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.AllGeoAlertON(
              user._id,
              transportId._id,
              geofence._id,
              alertId,
            );
          }
        }
      },
      lessThanOrEqual: () => {
        if (alert && alert.alertId && alert.status === false) {
          console.log(`AlertId ${alerts._id} status false.`);
          if (latestAISDataValue <= value) {
            message = `Alert: The ${fieldName} ${latestAISDataValue} of transport: ${transportId.transportName} is less than or equal to ${value}.`;
            this.sendGeoAlertAndTrigger_2(
              user,
              transportId,
              message,
              geofence,
              alerts._id,
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
            this.AllGeoAlertON(
              user._id,
              transportId._id,
              geofence._id,
              alertId,
            );
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

  async sendGeoAlertAndTrigger_2(
    user: any,
    transport: any,
    message: any,
    geoId: any,
    alertId: any,
    alertOnEmail: any,
    alertOnNotification: any,
  ): Promise<void> {
    if (alertOnEmail) {
      this.sendAlertEmail(user, transport, message, geoId.name);
    }
    if (alertOnNotification) {
      const type = "Geofence Alert Notification";
      this.createNotification_2(user._id, message, transport, type);
    }

    this.AllGeoAlertOff(user._id, transport._id, geoId._id, alertId);
  }

  async createNotification_2(
    userId: string,
    message: string,
    transport_id: any,
    type: string,
  ) {
    try {
      const transportName = transport_id?.transportName;
      const imoNumber = transport_id?.imoNumber;
      const notification = await this.notificationModel.create({
        title: "Geofence Alert Notification",
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

  async handleGeoAlerts2(geofence, latestAISData, user, transport) {
    let alertOnEmail;
    let alertOnNotification;
    if (geofence.alerts.length > 0) {
      for (const alert of geofence.alerts) {
        alertOnEmail = alert.alertOnEmail;
        alertOnNotification = alert.alertOnNotification;
        for (const criteria of alert.criteria) {
          this.compareActiveForALlGeoAlertCriteriaWithAISData(
            criteria,
            latestAISData,
            user,
            transport,
            alert,
            alert._id,
            geofence,
            alertOnEmail,
            alertOnNotification,
          );
        }
      }
    } else {
      console.log("This geofence does not have any alerts.");
    }
  }

  async AllGeoAlertOff(
    uid: string,
    transportId: any,
    geoId: string,
    alertId: string,
  ): Promise<void> {
    try {
      const result = await this.geofenceModel.updateOne(
        {
          created_by: new mongoose.Types.ObjectId(uid),
          _id: new mongoose.Types.ObjectId(geoId),
          "transports.transportId": new mongoose.Types.ObjectId(transportId),
          "transports.alerts.alertId": { $in: alertId },
        },
        {
          $set: {
            "transports.$[outerElem].alerts.$[innerElem].status": true,
          },
        },
        {
          arrayFilters: [
            {
              "outerElem.transportId": new mongoose.Types.ObjectId(transportId),
            },
            { "innerElem.alertId": new mongoose.Types.ObjectId(alertId) },
          ],
        },
      );
      console.log(result);
    } catch (error) {
      console.error("Error updating geo alerts:", error.message);
    }
  }

  async AllGeoAlertON(
    uid: string,
    transportId: any,
    geoId: string,
    alertId: string,
  ): Promise<void> {
    try {
      const result = await this.geofenceModel.updateOne(
        {
          created_by: new mongoose.Types.ObjectId(uid),
          _id: new mongoose.Types.ObjectId(geoId),
          "transports.transportId": new mongoose.Types.ObjectId(transportId),
          "transports.alerts.alertId": { $in: alertId },
        },
        {
          $set: {
            "transports.$[outerElem].alerts.$[innerElem].status": false,
          },
        },
        {
          arrayFilters: [
            {
              "outerElem.transportId": new mongoose.Types.ObjectId(transportId),
            },
            { "innerElem.alertId": new mongoose.Types.ObjectId(alertId) },
          ],
        },
      );
      console.log(result);
    } catch (error) {
      console.error("Error updating geo alerts:", error.message);
    }
  }
}
