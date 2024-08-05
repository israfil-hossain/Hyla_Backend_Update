import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { welcomeTemplate } from "./templates/welcome.template";

import { organizationWelcomeTemplate } from "./templates/welcomeOrganization.template";

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
      // user: 'rahulkadam0854@gmail.com',
      // pass: 'voioubywlyjlxqba',
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  async sendWelcomeEmail(
    to: string,
    name: string,
    orgName: string,
    password: string,
  ): Promise<string> {
    const subject = "Welcome to Hylapps";
    const html = welcomeTemplate(name, orgName, to, password, process.env.URL);

    try {
      const info = await this.transporter.sendMail({
        from: `Hylapps <${process.env.EMAIL}>`,
        to,
        subject,
        html,
      });

      console.log(to);
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

      return "Email sent successfully";
    } catch (error) {
      console.error("Error sending email:", error.message);
      throw new Error("Failed to send email");
    }
  }

  async sendWelcomeEmailToOrganization(
    to: string,
    name: string,
    orgName: string,
    password: string,
  ): Promise<string> {
    const subject = "Welcome to Hylapps";
    const html = organizationWelcomeTemplate(
      name,
      orgName,
      to,
      password,
      process.env.URL,
    );

    try {
      const info = await this.transporter.sendMail({
        from: `Hylapps <${process.env.EMAIL}>`,
        to,
        subject,
        html,
      });

      console.log(to);
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

      return "Email sent successfully";
    } catch (error) {
      console.error("Error sending email:", error.message);
      throw new Error("Failed to send email");
    }
  }

  async sendAlertEmail(
    to: string,
    transportName: string,
    imoNumber: string,
    alertMessage: string,
  ): Promise<string> {
    const subject = "Alert Notification";
    const html = `
      <p>Transport Name: ${transportName}</p>
      <p>IMO Number: ${imoNumber}</p>
      <p>Alert Message: ${alertMessage}</p>
      <p>You can access Hylapps at ${process.env.URL}</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendGeoAlertEmail(
    to: string,
    transportName: string,
    imoNumber: string,
    alertMessage: string,
    geofenceName: string,
  ): Promise<string> {
    const subject = "Alert Notification";
    const html = `
      <p>Transport Name: ${transportName}</p>
      <p>IMO Number: ${imoNumber}</p>
      <p>Geofence Name: ${geofenceName}</p>
      <p>Alert Message: ${alertMessage}</p>
      <p>You can access Hylapps at ${process.env.URL}</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendGeoFecneEntryAlertEmail(
    to: string,
    transportName: string,
    imoNumber: string,
    alertMessage: string,
  ): Promise<string> {
    const subject = "Alert Notification";
    const html = `
      <p>Transport Name: ${transportName}</p>
      <p>IMO Number: ${imoNumber}</p>
      <p>Geofence Notification: ${alertMessage}</p>
      <p>You can access Hylapps at ${process.env.URL}</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
  ): Promise<string> {
    const subject = "Password Reset Request";
    const html = `
      <p>You have requested to reset your password.</p>
      <p>Please click the following link to reset your password:</p>
      <a href="${process.env.RESET_URL}?token=${resetToken}">Reset Password</a>
    `;

    return this.sendEmail(to, subject, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<string> {
    try {
      const info = await this.transporter.sendMail({
        from: `Hylapps <${process.env.EMAIL}>`,
        to,
        subject,
        html,
      });

      return "Email sent successfully";
    } catch (error) {
      console.error("Error sending email:", error.message);
      throw new Error("Failed to send email");
    }
  }
}
