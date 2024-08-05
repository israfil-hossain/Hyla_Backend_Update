import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { AuthenticationService } from "./authentication.service";
import { RequestUser } from "./decorator/request-user.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { IsPublic } from "./guard/authentication.guard";

@ApiTags("Authentication")
@Controller("authentication")
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post("signIn")
  @HttpCode(200)
  @IsPublic()
  @ApiBody({ type: SignInDto })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get("verifyToken")
  verifyToken() {
    return "Token verification succeeded.";
  }

  @Post("tokenRefresh")
  @HttpCode(200)
  @IsPublic()
  @ApiBody({ type: RefreshTokenDto })
  tokenRefresh(@Body() tokenRefreshDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(tokenRefreshDto.refreshToken);
  }

  @Post("tokenRevoke")
  @HttpCode(200)
  @ApiBody({ type: RefreshTokenDto })
  tokenRevoke(@Body() tokenRefreshDto: RefreshTokenDto) {
    return this.authService.revokeRefreshToken(tokenRefreshDto.refreshToken);
  }

  @Post("changePassword")
  @HttpCode(200)
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @RequestUser() { userId }: ITokenPayload,
  ) {
    return this.authService.changePassword(changePasswordDto, userId);
  }
}
