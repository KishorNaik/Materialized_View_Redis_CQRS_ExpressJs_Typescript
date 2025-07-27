import {
	RequestData,
	sealed,
	StatusCodes,
	DataResponse,
	requestHandler,
	RequestHandler,
	DataResponseFactory,
	PipelineWorkflowException,
	PipelineWorkflow,
	Container,
  TransactionsWrapper,
  GuardWrapper,
  ResultFactory,
  ExceptionsWrapper,
  AesResponseDto,
  IAesEncryptResult,
} from '@kishornaik/utils';
import { GetUserByIdentifierRequestDto, GetUserByIdentifierResponseDto } from '../contracts';
import { logger } from '@/shared/utils/helpers/loggers';
import { mediator } from '@/shared/utils/helpers/medaitR';
import { GetUserByIdentifierWrapperQueryService } from '../../../../../shared/getByIdentifier';
import { GetUserByIdentifierEncryptResponseService } from './services/encryptResponse';
import { ENCRYPTION_KEY } from '@/config/env';
import { getQueryRunner, UserEntity } from '@kishornaik/db';
import { GetUserByIdentifierResponseMapService } from './services/mapResponse';

// #region Query
@sealed
export class GetUserByIdentifierQuery extends RequestData<DataResponse<AesResponseDto>>{
  private readonly _request: GetUserByIdentifierRequestDto;
  public constructor(request: GetUserByIdentifierRequestDto) {
    super();
    this._request = request;
  }

  public get request(): GetUserByIdentifierRequestDto {
    return this._request;
  }
}

//#endregion

enum pipelineSteps{
  QueryWrapperService="QueryWrapperService",
  MapResponseService="MapResponseService",
  EncryptResponseService="EncryptResponseService"
}

// #region Query Handler
@sealed
@requestHandler(GetUserByIdentifierQuery)
export class GetUserByIdentifierQueryHandler implements RequestHandler<GetUserByIdentifierQuery,DataResponse<AesResponseDto>>{

  private pipeline =new PipelineWorkflow(logger);
  private readonly _getUserByIdentifierWrapperQueryService:GetUserByIdentifierWrapperQueryService;
  private readonly _getUserByIdentifierEncryptResponseService:GetUserByIdentifierEncryptResponseService;
  private readonly _getUserByIdentifierResponseMapService:GetUserByIdentifierResponseMapService;

  public constructor(){
    this._getUserByIdentifierEncryptResponseService=Container.get(GetUserByIdentifierEncryptResponseService);
    this._getUserByIdentifierWrapperQueryService=Container.get(GetUserByIdentifierWrapperQueryService);
    this._getUserByIdentifierResponseMapService=Container.get(GetUserByIdentifierResponseMapService);
  }

  public async handle(value: GetUserByIdentifierQuery): Promise<DataResponse<AesResponseDto>> {
    const queryRunner=getQueryRunner();
    await queryRunner.connect();

    return await TransactionsWrapper.runDataResponseAsync({
      queryRunner:queryRunner,
      onTransaction: async () => {
        const {request}=value;

      // Guard
      const guardResult = new GuardWrapper()
        .check(value, 'value')
        .check(request, 'request')
        .validate();
      if (guardResult.isErr())
        return DataResponseFactory.error<AesResponseDto>(
          guardResult.error.statusCode,
          guardResult.error.message
        );

      // Call Query Wrapper
      await this.pipeline.step(pipelineSteps.QueryWrapperService, async () => {
        return await this._getUserByIdentifierWrapperQueryService.handleAsync({
          request:request,
          queryRunner:queryRunner
        })
      });

      // Map Response
      await this.pipeline.step(pipelineSteps.MapResponseService,async ()=>{
        const userEntityResult=await this.pipeline.getResult<UserEntity>(pipelineSteps.QueryWrapperService);
        return await this._getUserByIdentifierResponseMapService.handleAsync(userEntityResult);
      })


      // Encrypt Response
      await this.pipeline.step(pipelineSteps.EncryptResponseService, async () => {
        const userEntityResult=await this.pipeline.getResult<UserEntity>(pipelineSteps.QueryWrapperService);
        const getIdentifierByResponseDtoResult=await this.pipeline.getResult<GetUserByIdentifierResponseDto>(pipelineSteps.MapResponseService);

        return await this._getUserByIdentifierEncryptResponseService.handleAsync({
          data:getIdentifierByResponseDtoResult,
          key:userEntityResult.userKeys.aesSecretKey
        });
      });

      // Return Response
      const response=this.pipeline.getResult<IAesEncryptResult>(pipelineSteps.EncryptResponseService);
      return DataResponseFactory.success<AesResponseDto>(StatusCodes.OK, response.aesResponseDto);
      }
    })
  }
}

// #endregion
