import { BoolEnum, Column, Entity, JoinColumn, OneToOne, ViewColumn } from "@kishornaik/utils";
import { BaseEntity } from "../../../../../shared/entity/base";
import { UserEntity } from "../tUsers";
import { IsNotEmpty, IsUUID, ValidateIf } from "class-validator";

@Entity({schema:"user",name:`usersSettings`})
export class UsersSettingsEntity extends BaseEntity{

  @Column(`varchar`,{length:50, nullable:false})
  @ValidateIf((v)=> v.emailVerificationToken!==null && v.emailVerificationToken!==undefined)
  @IsNotEmpty()
  @IsUUID()
  public emailVerificationToken?:string|null;

  @Column(`date`,{nullable:false})
  public emailVerificationTokenExpiresAt?: Date|null;

  @Column(`enum`,{enum:BoolEnum,default:BoolEnum.NO})
  public isEmailVerified?: BoolEnum;

  @Column(`enum`,{enum:BoolEnum,default:BoolEnum.NO})
  public isVerificationEmailSent?:BoolEnum;

  @Column(`enum`,{enum:BoolEnum,default:BoolEnum.NO})
  public isWelcomeEmailSent?: BoolEnum;

  @ViewColumn({name:"userId"})
  public userId?:string;

  @OneToOne(()=> UserEntity, (users)=> users.userSettings?.users,{cascade:true })
  @JoinColumn({name:"userId",referencedColumnName:"identifier"})
  public users?:UserEntity;

}
