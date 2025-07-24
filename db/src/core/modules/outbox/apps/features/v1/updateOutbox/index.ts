import { sealed, Service } from '@kishornaik/utils';
import { UpdateService } from '../../../../../../shared/services/db/update';
import { OutboxEntity } from '../../../../outbox.Module';

@sealed
@Service()
export class UpdateOutboxDbService extends UpdateService<OutboxEntity> {
	public constructor() {
		super(OutboxEntity);
	}
}
