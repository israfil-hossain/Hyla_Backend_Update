import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches, MinLength } from "class-validator";

export class ResetForgotPasswordDto {
  @ApiProperty({
    description: "Password reset token",
  })
  @IsNotEmpty({ message: "Password reset token should not be empty" })
  resetToken: string;

  @ApiProperty({
    description: "The user's new password",
  })
  @IsNotEmpty({ message: "New password should not be empty" })
  @MinLength(8, { message: "New password must be at least 8 characters long" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]*$/, {
    message:
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  newPassword: string;
}
