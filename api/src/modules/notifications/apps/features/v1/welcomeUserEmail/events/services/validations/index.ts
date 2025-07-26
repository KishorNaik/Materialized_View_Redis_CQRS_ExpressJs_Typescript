import { DtoValidation, sealed, Service } from "@kishornaik/utils";
import { WelcomeUserEmailIntegrationEventRequestDto } from "../../../contracts";

@sealed
@Service()
export class WelcomeUserEmailValidationService extends DtoValidation<WelcomeUserEmailIntegrationEventRequestDto>{
  public constructor(){
    super();
  }
}
