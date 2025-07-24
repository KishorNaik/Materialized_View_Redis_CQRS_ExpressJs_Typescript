import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { CreateUserRequestDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserRequestValidationService extends DtoValidation<CreateUserRequestDto> {
	public constructor() {
		super();
	}
}
