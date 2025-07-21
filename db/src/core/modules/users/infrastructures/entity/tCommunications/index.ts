import { Column, Entity, Index, IsSafeString, JoinColumn, OneToOne, ViewColumn} from "@kishornaik/utils";
import { UserEntity } from "../tUsers";
import { IsEmail, IsMobilePhone, IsNotEmpty } from 'class-validator';
import { BaseEntity } from "../../../../../shared/entity/base";
@Entity({schema:"user",name:"usersCommunication"})
export class UserCommunicationEntity extends BaseEntity{

  @Column(`varchar`,{length:100, nullable:false})
  @Index({unique:true})
  @IsNotEmpty()
  @IsEmail()
  public email?:string;

  @Column(`varchar`,{nullable:false})
  @Index({unique:true})
  @IsNotEmpty()
  @IsMobilePhone(`en-IN`)
  public mobileNo?:string;

  @ViewColumn({name:"userId"})
  public userId?:string;

  @OneToOne(()=> UserEntity,(users)=> users.userCommunication,{cascade:true})
  @JoinColumn({name:'userId', referencedColumnName:"identifier"})
  public users?:UserEntity;
}
