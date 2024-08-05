import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { EncryptionService } from "../encryption/encryption.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { TokenResponseDto } from "./dto/token-response.dto";
import {
  RefreshToken,
  RefreshTokenDocument,
} from "./entities/refresh-token.entity";

@Injectable()
export class AuthenticationService {
  private readonly logger: Logger = new Logger(AuthenticationService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,

    private readonly jwtService: JwtService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<TokenResponseDto> {
    try {
      const user = await this.userModel.findOne({
        email: signInDto.email,
      });

      if (!user) {
        throw new NotFoundException(
          `No user found with email: ${signInDto.email}`,
        );
      }
      if (
        !(await this.encryptionService.verifyPassword(
          signInDto.password,
          user.password,
        ))
      ) {
        this.logger.error(
          `Invalid credentials provided with email: ${signInDto.email}`,
        );
        throw new UnauthorizedException("Invalid credentials provided");
      }

      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.createRefreshToken(user?.id?.toString());

      return new TokenResponseDto(accessToken, refreshToken);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error authenticating user:`, error);
      throw new BadRequestException("Could not authenticate user");
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const refreshTokenDoc = await this.refreshTokenModel.findOne(
        {
          token: refreshToken,
          expiresAt: { $gt: new Date() },
        },
        {
          populate: [
            {
              path: "tokenUser",
            },
          ],
        },
      );

      if (!refreshTokenDoc) {
        this.logger.error("Refresh token is invalid or expired");
        throw new BadRequestException("Refresh token is invalid or expired");
      }

      const userData = refreshTokenDoc?.tokenUser as unknown as UserDocument;
      const accessToken = await this.generateAccessToken(userData);

      return new TokenResponseDto(accessToken, refreshToken);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error refreshing token:`, error);
      throw new BadRequestException("Could not refresh token");
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<string> {
    try {
      const refreshTokenDoc = await this.refreshTokenModel.findOne({
        token: refreshToken,
        expiresAt: { $gt: new Date() },
      });

      if (!refreshTokenDoc) {
        this.logger.error(
          `Token is either invalid or expired: ${refreshToken}`,
        );
        throw new BadRequestException(
          "Refresh token is either invalid or expired",
        );
      }

      await this.refreshTokenModel.findOneAndUpdate(
        { _id: refreshTokenDoc._id },
        {
          expiresAt: new Date(),
        },
      );

      return "Refresh token revoked successfully";
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error revoking token:`, error);
      throw new BadRequestException("Could not revoke token");
    }
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userId: string,
  ): Promise<string> {
    try {
      if (changePasswordDto.oldPassword === changePasswordDto.newPassword) {
        throw new BadRequestException(
          "New password cannot be same as old password",
        );
      }

      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException(`No user found with id: ${userId}`);
      }

      if (
        !(await this.encryptionService.verifyPassword(
          changePasswordDto.oldPassword,
          user.password,
        ))
      ) {
        this.logger.error(
          `User ${userId} tried to change password with an incorrect old password`,
        );
        throw new BadRequestException("Old Password is incorrect");
      }

      const hashedPassword = await this.encryptionService.hashPassword(
        changePasswordDto.newPassword,
      );

      await this.userModel.findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          password: hashedPassword,
        },
      );

      return "Password changed successfully";
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error changing password:`, error);
      throw new BadRequestException("Could not change password");
    }
  }

  async getLoggedInUser(userId: string): Promise<string> {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException(`No user found with id: ${userId}`);
      }

      return "Token verification succeeded.";
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error getting current user:`, error);
      throw new BadRequestException("Could not get user info");
    }
  }

  // Private Helper Methods
  private async generateAccessToken(userData: UserDocument) {
    try {
      if (!userData?._id || !userData?.email) {
        throw new Error("Invalid user data for token generation");
      }

      const tokenPayload: ITokenPayload = {
        userId: userData?._id?.toString(),
        userEmail: userData?.email,
        isSuperUser: userData?.isSuperUser,
        isOrganizationOwner: userData?.isOrganizationOwner,
      };

      return await this.jwtService.signAsync(tokenPayload);
    } catch (error) {
      this.logger.error("Error generating JWT token", error);
      throw new InternalServerErrorException("Error generating JWT token");
    }
  }

  private async createRefreshToken(userId: string): Promise<string> {
    try {
      const token = this.encryptionService.generateUniqueToken();

      const refreshToken = await this.refreshTokenModel.create({
        token,
        user: userId,
      });

      return refreshToken.token;
    } catch (error) {
      this.logger.error("Error generating refresh token", error);
      throw new InternalServerErrorException("Error generating refresh token");
    }
  }
}
