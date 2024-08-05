/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { FirebaseAuthGuard } from "./FirebaseAuthGuard";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Firebase API")
@Controller("firebase")
export class FirebaseController {
  @Get("verifyToken")
  @UseGuards(FirebaseAuthGuard) // Apply guard for authorization
  async tokenVerification(@Req() req): Promise<any> {
    return { message: "Token verification succeeded." };
  }
}
