import { sealed, Service } from '@kishornaik/utils';
import { GetByVersionIdentifierService } from '../../../../../../shared/services/db/getVersion';
import { UserEntity } from '../../../../user.Module';

@sealed
@Service()
export class GetUserRowVersionDbService extends GetByVersionIdentifierService<UserEntity> {
	public constructor() {
		super(UserEntity);
	}
}
