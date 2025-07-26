import {
	IServiceHandlerAsync,
	Result,
	ResultError,
	ResultFactory,
	sealed,
	Service,
	StatusCodes,
	ExceptionsWrapper,
  GuardWrapper,
} from '@kishornaik/utils';
import { WelcomeUserEmailIntegrationEventRequestDto } from '../../../contracts';

export interface IEmailSentEmailService
	extends IServiceHandlerAsync<WelcomeUserEmailIntegrationEventRequestDto, boolean> {}

@sealed
@Service()
export class EmailSentService implements IEmailSentEmailService {
	public handleAsync(params: WelcomeUserEmailIntegrationEventRequestDto): Promise<Result<boolean, ResultError>> {
		return ExceptionsWrapper.tryCatchResultAsync(async () => {
			// Guard
      const guardResult = new GuardWrapper()
        .check(params, 'params')
        .validate();
      if (guardResult.isErr())
        return ResultFactory.error(guardResult.error.statusCode, guardResult.error.message);

			console.log(`Email sent to ${params.email}`);

			return ResultFactory.success(true);
		});
	}
}
