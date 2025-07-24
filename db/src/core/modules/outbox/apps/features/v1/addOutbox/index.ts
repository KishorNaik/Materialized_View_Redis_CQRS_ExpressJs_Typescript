import { sealed, Service } from '@kishornaik/utils';
import { AddService } from '../../../../../../shared/services/db/add';
import { OutboxEntity } from '../../../../infrastructure/entity';

@sealed
@Service()
export class AddOutboxDbService extends AddService<OutboxEntity> {
	public constructor() {
		super(OutboxEntity);
	}
}
