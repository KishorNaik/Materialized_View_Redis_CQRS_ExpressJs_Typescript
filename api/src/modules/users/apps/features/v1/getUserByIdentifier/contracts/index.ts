import { BoolEnum } from "@kishornaik/utils";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

// #region Request Dto
export class GetUserByIdentifierRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @Type(() => String)
  id: string;
}
// endregion

// #region Response Dto
export class GetUserByIdentifierResponseDto {
  public identifier?: string;
  public clientId?: string;
  public firstName?: string;
  public lastName?: string;
  public userName?: string;
  public communication?:{
    identifier?: string;
    email?: string;
    mobileNo?: string;
  };
  public settings:{
    identifier?:string;
    isEmailVerified?: BoolEnum;
    isVerificationEmailSent?: BoolEnum;
    isWelcomeEmailSent?: BoolEnum;
  }
}
// #endregion
