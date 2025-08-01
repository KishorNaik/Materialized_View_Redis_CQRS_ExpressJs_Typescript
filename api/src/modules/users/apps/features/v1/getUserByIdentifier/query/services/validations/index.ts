import { DtoValidation, sealed, Service } from '@kishornaik/utils';
import { GetUserByIdentifierRequestDto } from '../../../contracts';

@sealed
@Service()
export class GetUserByIdentifierValidationService extends DtoValidation<GetUserByIdentifierRequestDto> {
	public constructor() {
		super();
	}
}
