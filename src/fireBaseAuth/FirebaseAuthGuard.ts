import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.headers.authorization) {
      throw new UnauthorizedException("Authorization header is missing");
    }

    const token = request.headers.authorization.replace("Bearer ", "");

    try {
      // Verify the token (without automatic refresh)
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      console.error("Error during token verification:", error.message);

      if (error.code === "auth/argument-error") {
        throw new UnauthorizedException("Invalid token");
      } else if (error.code === "auth/id-token-expired") {
        // Handle expired token gracefully (optional)
        // You can choose to implement token refresh logic here,
        // but be mindful of potential security implications.
        throw new ForbiddenException("Token has expired. Refresh is disabled.");
      } else {
        console.error("Detailed error:", error);
        throw new ForbiddenException("Access forbidden");
      }
    }
  }
}
