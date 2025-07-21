import { Column, Entity, Index, IsSafeString,OneToOne} from "@kishornaik/utils";
import { IsNotEmpty, IsString } from "class-validator";
import { BaseEntity } from "db/src/core/shared/entity/base";
import { UserCommunicationEntity } from "../tCommunications";

@Entity({schema:`user`, name:"users"})
export class UserEntity extends BaseEntity{

  @Column(`varchar`,{length:100,nullable:false})
  @IsNotEmpty()
  @IsString()
  @IsSafeString()
  public firstName?:string;

  @Column(`varchar`,{length:100,nullable:false})
  @IsNotEmpty()
  @IsString()
  @IsSafeString()
  public lastName?:string;

  @Column(`varchar`,{length:255,nullable:false})
  @Index({unique:true})
  @IsNotEmpty()
  @IsString()
  @IsSafeString()
  public clientId?:string;

  @OneToOne(()=> UserCommunicationEntity,(userCommunication)=> userCommunication.users)
  public userCommunication?:UserCommunicationEntity;
}
