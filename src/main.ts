import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import morgan from "morgan";
import * as path from "path";
import * as fs from "fs";
import { ValidationPipe } from "@nestjs/common";
import { BucketService } from "./bucket/bucket.service";
import { AppService } from "./app.service";
import { GeoFencesAlertService } from "./geofencesAlert.service";
import { configureSwaggerUI } from "./config/swagger.config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

let app;
async function bootstrap() {
  app = await NestFactory.create(AppModule);
  app.enableCors();

  // const logFilePath = path.resolve(__dirname, 'access.log');

  const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" },
  );
  // Swagger configuration
  configureSwaggerUI(app);

  app.use(morgan("combined", { stream: accessLogStream }));

  try {
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix("api");
    await app.listen(8000);
    console.log("Application is listening on port 8000");
  } catch (error) {
    console.error("Error starting the application:", error.message);
  }
}
bootstrap();

const fetcher = async (sat: boolean) => {
  const mode = process.env.MODE;
  const bucketService = app.get(BucketService);
  await bucketService.fetchDataAndSaveToBucket(mode, sat);
};

const fetchAndSaveTERDataInterval = setInterval(
  fetcher,
  parseFloat(process.env.FETCH_TER_DATA_TIME_INTERVAL) * 60 * 1000,
  false,
);

const fetchAndSaveSATDataInterval = setInterval(
  fetcher,
  parseFloat(process.env.FETCH_SAT_DATA_TIME_INTERVAL) * 60 * 1000,
  true,
);

const alertInterval = setInterval(
  async () => {
    try {
      const userService = app.get(AppService);
      const geoFenceAlertService = app.get(GeoFencesAlertService);
      userService.sendAlertsToToiUsers();
      geoFenceAlertService.sendGeofenceAlertsToToiUsers();
      geoFenceAlertService.ActiveForAllGeofenceForUserTransport();
    } catch (error) {
      console.error("Error in interval:", error);
    }
  },
  parseFloat(process.env.ALERT_TIME) * 60 * 1000,
);

process.on("SIGINT", () => {
  clearInterval(fetchAndSaveTERDataInterval);
  clearInterval(fetchAndSaveSATDataInterval);
  clearInterval(alertInterval);
  process.exit(0);
});
