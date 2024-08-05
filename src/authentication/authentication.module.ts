import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { jwtConfig } from "src/config/jwt.config";
import { EncryptionModule } from "src/encryption/encryption.module";
import { User, UserSchema } from "src/user/user.model";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import {
  RefreshToken,
  RefreshTokenSchema,
} from "./entities/refresh-token.entity";
import { AuthenticationGuardProvider } from "./guard/authentication.guard";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync(jwtConfig),
    ConfigModule,
    EncryptionModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationGuardProvider, AuthenticationService],
})
export class AuthenticationModule {}
