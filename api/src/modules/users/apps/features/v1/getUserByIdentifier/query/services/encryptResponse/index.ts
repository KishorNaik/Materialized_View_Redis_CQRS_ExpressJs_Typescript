import { AesEncryptWrapper, sealed, Service } from "@kishornaik/utils";
import { GetUserByIdentifierResponseDto } from "../../../contracts";

@sealed
@Service()
export class GetUserByIdentifierEncryptResponseService extends AesEncryptWrapper<GetUserByIdentifierResponseDto>{
  public constructor(){
    super();
  }
}
