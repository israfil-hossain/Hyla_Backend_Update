// update-user.dto.ts

import { IsNotEmpty, IsArray } from "class-validator";

export class UpdateUserDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsArray()
  roles?: any[];
}
