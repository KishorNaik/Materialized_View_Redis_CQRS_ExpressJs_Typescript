import { IsSafeString } from "@kishornaik/utils";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

// #region Request Dto
export class WelcomeUserEmailIntegrationEventRequestDto {

  @IsString()
  @IsNotEmpty()
  @IsSafeString()
  @IsEmail()
  public email:string;

  @IsString()
  @IsSafeString()
  @IsNotEmpty()
  public fullName:string;

  @IsString()
  @IsSafeString()
  @IsNotEmpty()
  public emailVerificationToken:string;
}
// #endregion
