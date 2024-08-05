import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import * as argon2 from "argon2";
import * as base64url from "base64url";
import * as uuid from "uuid";

@Injectable()
export class EncryptionService {
  private readonly saltRounds: number = 10;
  private readonly logger: Logger = new Logger(EncryptionService.name);

  async hashPassword(rawPassword: string): Promise<string> {
    if (!rawPassword) {
      this.logger.error("Password is required");
      throw new BadRequestException("Password is required");
    }

    try {
      return await argon2.hash(rawPassword);
    } catch (err) {
      this.logger.error("Failed to hash password", err);
      throw new Error("Failed to hash password");
    }
  }

  async verifyPassword(
    rawPassword: string = "",
    hashedPassword: string = "",
  ): Promise<boolean> {
    if (!rawPassword) {
      this.logger.error("Password is required");
      throw new BadRequestException("Password is required");
    }

    try {
      return await argon2.verify(hashedPassword, rawPassword);
    } catch (err) {
      this.logger.error("Failed to verify password", err);
      throw new Error("Failed to verify password");
    }
  }

  generateUniqueToken(length: number = 3): string {
    const mergedUuid = Array.from({ length }, () => uuid.v7()).join("");
    const tokenBuffer = Buffer.from(mergedUuid.replace(/-/g, ""), "hex");
    return base64url.default(tokenBuffer);
  }

  generateTimestampToken(secret: string, expireTime: number): string {
    if (!secret) {
      this.logger.error("Secret data is required");
      throw new BadRequestException("Secret data is required");
    }

    const combinedData = `${secret}:${expireTime}`;
    return base64url.default(combinedData);
  }

  decryptTimestampToken(token: string): string | null {
    if (!token) {
      this.logger.error("Token is required");
      throw new BadRequestException("Token is required");
    }

    try {
      const decryptedData = base64url.default.decode(token);
      const [secret, timestampString] = decryptedData.split(":");

      if (!timestampString || isNaN(Number(timestampString))) {
        this.logger.error("Invalid token format");
        return null;
      }

      const timestamp = parseInt(timestampString, 10);
      if (Date.now() > timestamp) {
        this.logger.error("Token has expired");
        return null;
      }

      return secret;
    } catch (error) {
      this.logger.error("Failed to decode token", error);
      return null;
    }
  }
}
