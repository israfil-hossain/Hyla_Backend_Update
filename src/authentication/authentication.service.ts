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
import { MailerService } from "src/mail/mailer.service";
import { User, UserDocument } from "src/user/user.model";
import { EncryptionService } from "../encryption/encryption.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetForgotPasswordDto } from "./dto/reset-forgot-password.dto";
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
    private readonly mailerService: MailerService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<TokenResponseDto> {
    try {
      const user = await this.userModel
        .findOne({
          email: signInDto.email,
        })
        .exec();

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
      const refreshToken = await this.createRefreshToken(user?._id?.toString());

      return new TokenResponseDto(accessToken, refreshToken);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error authenticating user:`, error);
      throw new BadRequestException("Could not authenticate user");
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const refreshTokenDoc = await this.refreshTokenModel
        .findOne({
          token: refreshToken,
          expiresAt: { $gt: new Date() },
        })
        .populate("tokenUser")
        .exec();

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
      const refreshTokenDoc = await this.refreshTokenModel
        .findOne({
          token: refreshToken,
          expiresAt: { $gt: new Date() },
        })
        .exec();

      if (!refreshTokenDoc) {
        this.logger.error(
          `Token is either invalid or expired: ${refreshToken}`,
        );
        throw new BadRequestException(
          "Refresh token is either invalid or expired",
        );
      }

      await this.refreshTokenModel
        .findOneAndUpdate(
          { _id: refreshTokenDoc._id },
          {
            expiresAt: new Date(),
          },
        )
        .exec();

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

      const user = await this.userModel.findById(userId).exec();

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

      const updatedUser = await this.userModel
        .findOneAndUpdate(
          {
            _id: user._id,
          },
          {
            password: hashedPassword,
          },
        )
        .exec();

      if (!updatedUser) {
        throw new BadRequestException("Could not update password");
      }

      return "Password changed successfully";
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`Error changing password:`, error);
      throw new BadRequestException("Could not change password");
    }
  }

  async forgotPassword(forgotDto: ForgotPasswordDto): Promise<string> {
    const user = await this.userModel
      .findOne({ email: forgotDto.email })
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    const resetToken = this.encryptionService.generateTimestampToken(
      user?._id?.toString(),
      expiryTime,
    );

    await this.mailerService.sendPasswordResetEmail(user.email, resetToken);

    return "Password reset email sent";
  }

  async resetForgotPassword(resetDto: ResetForgotPasswordDto): Promise<string> {
    const userId = this.encryptionService.decryptTimestampToken(
      resetDto.resetToken,
    );

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const hashedPassword = await this.encryptionService.hashPassword(
      resetDto.newPassword,
    );

    const updatedUser = await this.userModel
      .findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          password: hashedPassword,
        },
      )
      .exec();

    if (!updatedUser) {
      throw new BadRequestException("Could not update password");
    }

    return "Password changed successfully";
  }

  //#region Private Helper Methods
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
        tokenUser: userId,
      });

      return refreshToken.token;
    } catch (error) {
      this.logger.error("Error generating refresh token", error);
      throw new InternalServerErrorException("Error generating refresh token");
    }
  }
  //#endregion
}
