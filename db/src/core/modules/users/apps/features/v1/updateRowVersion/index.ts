import { sealed, Service } from "@kishornaik/utils";
import { UpdateService } from "../../../../../../shared/services/db/update";
import { UserEntity } from "../../../../user.Module";

@sealed
@Service()
export class UpdateUserVersionDbService extends UpdateService<UserEntity> {
	public constructor() {
		super(UserEntity);
	}
}
