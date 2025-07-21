import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryStringParametersModel {
	@Transform(({ value }) => parseInt(value, 10) || 1)
	@IsNumber()
	@IsPositive()
	@IsOptional()
	public pageNumber: number = 1;

	@Transform(({ value }) => parseInt(value, 10) || 10)
	@IsNumber()
	@IsPositive()
	@IsOptional()
	public pageSize: number = 10;
}
