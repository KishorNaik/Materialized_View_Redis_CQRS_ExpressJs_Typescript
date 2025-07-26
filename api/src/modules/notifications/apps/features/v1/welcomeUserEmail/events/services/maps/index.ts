import { ExceptionsWrapper, GuardWrapper, IServiceHandlerAsync, JsonString, Result, ResultError, ResultFactory, sealed, Service } from "@kishornaik/utils";
import { WelcomeUserEmailIntegrationEventRequestDto } from "../../../contracts";

export interface IWelcomeUserEmailMapService extends IServiceHandlerAsync<JsonString, WelcomeUserEmailIntegrationEventRequestDto> { }

@sealed
@Service()
export class WelcomeUserEmailMapService implements IWelcomeUserEmailMapService {
  public handleAsync(params: JsonString): Promise<Result<WelcomeUserEmailIntegrationEventRequestDto, ResultError>> {
    return ExceptionsWrapper.tryCatchResultAsync(async ()=>{

      // Guard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

      // Map Dto
      const requestDto:WelcomeUserEmailIntegrationEventRequestDto=JSON.parse(params);
      return ResultFactory.success(requestDto);
    });
  }

}
