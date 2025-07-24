import { Response } from 'express';
import {
	Body,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { ValidationMiddleware } from '@/middlewares/security/validations';
import { StatusCodes, DataResponse as ApiDataResponse, AesRequestDto } from '@kishornaik/utils';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { CreateUserCommand } from '../commands';

@JsonController(`/api/v1/users`)
@OpenAPI({ tags: [`users`] })
export class CreateUserEndpoint {
	@Post()
	@OpenAPI({
		summary: `Create User`,
		tags: [`users`],
		description: `Create a new user in the system.`,
	})
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(AesRequestDto))
	public async postAsync(@Body() request: AesRequestDto, @Res() res: Response) {
		const response = await mediator.send(new CreateUserCommand(request));
		return res.status(response.StatusCode).json(response);
	}
}
