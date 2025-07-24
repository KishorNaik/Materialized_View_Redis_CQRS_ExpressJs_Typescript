import { AesDecryptWrapper, sealed, Service } from '@kishornaik/utils';
import { CreateUserRequestDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserDecryptService extends AesDecryptWrapper<CreateUserRequestDto> {
	public constructor() {
		super();
	}
}
