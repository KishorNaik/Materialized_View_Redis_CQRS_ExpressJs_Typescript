import { Response, Request } from 'express';
import { Get, HttpCode, JsonController, OnUndefined, Param, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { HttpStatusCode } from '@kishornaik/utils';
import { GetUserByIdentifierQuery } from '../query';
import { GetUserByIdentifierRequestDto } from '../contracts';

@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class GetUserByIdentifierEndpoint {
	@Get('/:identifier')
	@HttpCode(HttpStatusCode.Ok)
	@OnUndefined(HttpStatusCode.BadRequest)
	@OnUndefined(HttpStatusCode.NotFound)
	async getAsync(@Param('identifier') identifier: string, @Res() res: Response) {
		const request = new GetUserByIdentifierRequestDto();
		request.id = identifier;

		const response = await mediator.send(new GetUserByIdentifierQuery(request));
		return res.status(response.StatusCode).json(response);
	}
}
