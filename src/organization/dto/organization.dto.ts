// organization.dto.ts

import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  ownerName: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  owner_id: string;

  // @IsNotEmpty()
  // @IsString()
  // idp_id: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  created_by: string;
}
