import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
  @ApiProperty({
    description: "Access token",
  })
  accessToken: string;

  @ApiProperty({
    description: "Refresh token",
  })
  refreshToken: string;

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
