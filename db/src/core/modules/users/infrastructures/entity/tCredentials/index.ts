
import { Column, Entity, Index, IsSafeString,JoinColumn,OneToOne, ViewColumn} from "@kishornaik/utils";
import { BaseEntity } from "../../../../../shared/entity/base";
import { UserEntity } from "../tUsers";
import { IsEmail, IsNotEmpty } from "class-validator";

@Entity({schema:`user`,name:`usersCredentials`})
export class UserCredentialsEntity extends BaseEntity{

  @Column(`varchar`,{length:100, nullable:false})
  @Index({unique:true})
  @IsNotEmpty()
  @IsEmail()
  public userName?:string;

  @Column(`text`)
  @IsNotEmpty()
  public salt?:string;

  @Column(`text`)
  @IsNotEmpty()
  public hash?:string;

  @ViewColumn({name:'userId'})
  public userId?:string;

  @OneToOne(()=>UserEntity,(users)=> users.userCredentials, {cascade:true })
  @JoinColumn({name:`userId`,referencedColumnName:"identifier"})
  public users?:UserEntity;
}
