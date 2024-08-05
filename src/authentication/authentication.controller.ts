import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { AuthenticationService } from "./authentication.service";
import { AuthUserId } from "./decorator/auth-user-id.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { IsPublic } from "./guard/authentication.guard";

@ApiTags("Authentication")
@Controller("Authentication")
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post("SignIn")
  @HttpCode(200)
  @IsPublic()
  @ApiBody({ type: SignInDto })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post("TokenRefresh")
  @HttpCode(200)
  @IsPublic()
  @ApiBody({ type: RefreshTokenDto })
  tokenRefresh(@Body() tokenRefreshDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(tokenRefreshDto.refreshToken);
  }

  @Post("TokenRevoke")
  @HttpCode(200)
  @IsPublic()
  @ApiBody({ type: RefreshTokenDto })
  tokenRevoke(@Body() tokenRefreshDto: RefreshTokenDto) {
    return this.authService.revokeRefreshToken(tokenRefreshDto.refreshToken);
  }

  @Post("ChangePassword")
  @HttpCode(200)
  @ApiBody({ type: ChangePasswordDto })
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @AuthUserId() { userId }: ITokenPayload,
  ) {
    return this.authService.changePassword(changePasswordDto, userId);
  }

  @Get("GetLoggedInUser")
  getLoggedInUser(@AuthUserId() { userId }: ITokenPayload) {
    return this.authService.getLoggedInUser(userId);
  }
}
