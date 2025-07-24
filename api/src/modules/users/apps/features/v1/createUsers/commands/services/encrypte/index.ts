import { AesDecryptWrapper, AesEncryptWrapper, sealed, Service } from '@kishornaik/utils';
import { CreateUserResponseDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserEncryptResponseService extends AesEncryptWrapper<CreateUserResponseDto> {
	public constructor() {
		super();
	}
}
