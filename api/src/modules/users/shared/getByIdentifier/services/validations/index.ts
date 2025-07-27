import { DtoValidation, sealed, Service } from "@kishornaik/utils";
import { GetUserByIdentifierRequestDto } from "../../../../apps/features/v1/getUserByIdentifier/contracts";

@sealed
@Service()
export class GetUserByValidationService extends DtoValidation<GetUserByIdentifierRequestDto>{
  public constructor(){
    super();
  }
}
