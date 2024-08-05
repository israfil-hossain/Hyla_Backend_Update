import type { Request as ExpressRequest } from "express";

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Provider,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

const IS_PUBLIC_KEY = "IS_PUBLIC_KEY";
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
class AuthenticationGuard implements CanActivate {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //#region Allow when IsPublic is used
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    //#endregion

    //#region Verify jwt token from request or throw
    try {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);

      const tokenPayload: ITokenPayload = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>(
            "JWT_SECRET",
            "ACOMPLEXSECRETANDKEEPITSAFE",
          ),
        },
      );

      if (!tokenPayload.userId) {
        throw new Error("Invalid payload found in token");
      }

      request["user"] = tokenPayload;
    } catch (error) {
      this.logger.error("Token validation error", error);
      throw new UnauthorizedException(
        "User is not authenticated. Please sign in and provide valid jwt token",
      );
    }

    return true;
    //#endregion
  }

  //#region Private helper methods
  private extractTokenFromHeader(request: ExpressRequest): string {
    const [type = "", token = ""] =
      request?.headers?.authorization?.split(" ") ?? [];

    if (type?.toLowerCase() !== "bearer" || !token) {
      throw new Error("Invalid authorization header");
    }

    return token;
  }
  //#endregion
}

export const AuthenticationGuardProvider: Provider = {
  provide: APP_GUARD,
  useClass: AuthenticationGuard,
};
