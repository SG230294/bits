import { Inject, Injectable, OnModuleInit, Type } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { promisify } from '@bits/grpc/grpc.utils';
import { convertServiceInputToGrpc, renameFunc } from '@bits/bits.utils';
import { IGrpcService } from '@bits/grpc/grpc.interface';
import { transformAndValidate } from '@bits/dto.utils';
import { IConnection } from '@bits/bits.types';
import { ICrudService } from '@bits/services/interface.service';
import { FindManyOptions, FindOneOptions, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { NestedFindManyOpts } from '@bits/db/repo.interface';
import { generateFieldMask } from '@bits/grpc/field-mask.grpc.utils';

export type WrappedGrpcService<
  Svc extends IGrpcService<From>,
  From extends ObjectLiteral,
  To,
> = Omit<Svc, 'findMany' | 'createOne' | 'findOne' | 'updateOne' | 'deleteOne'> &
  ICrudService<To> & {
    grpcSvc: Svc;
    validate(input: From): To;
    validate(input: From[]): To[];
  };

/**
 * создает и оборачивает gRPC сервис
 */
export function getDefaultGrpcCrudServiceWrapper<
  Service extends IGrpcService<From>,
  From extends object,
  To extends object = From,
  Excluded extends keyof Service = never,
>(
  packageToken: string,
  serviceName: string,
  DTOCls?: Type<To>,
): Type<Omit<WrappedGrpcService<Service, From, To>, Excluded>> {
  @Injectable()
  class GenericGrpcService implements OnModuleInit, ICrudService<To> {
    public grpcSvc!: Service;

    constructor(
      @Inject(packageToken) private client: ClientGrpc, // @InjectRepository(PushSubscriber) private subscriberRepository: Repository<PushSubscriber>,
    ) {}

    onModuleInit(): any {
      this.grpcSvc = promisify(this.client.getService<Service>(serviceName));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const { findMany, ...rest } = this.grpcSvc;
      for (const methName of Object.keys(this.grpcSvc)) {
        if (!(GenericGrpcService as any).prototype[methName])
          (GenericGrpcService as any).prototype[methName] = (this.grpcSvc as any)[methName];
      }
    }

    validate(input: From): To;
    validate(input: From[]): To[];
    validate(input: From | From[]): To | To[] {
      if (DTOCls) return transformAndValidate(DTOCls, input as any);
      return input as any;
    }

    // findOne(input: FindOneInput) {
    //   return this.svc.findOne(input);
    // }

    async findMany(input: FindManyOptions<To>): Promise<To[]> {
      const many = await this.grpcSvc.findMany(
        convertServiceInputToGrpc(this.convertDtoInputToGrpc(input)),
      );
      const valid = this.validate(many.nodes);
      return valid;
    }

    async findManyAndCount(filter?: NestedFindManyOpts<To>): Promise<IConnection<To>> {
      const many = await this.grpcSvc.findMany(filter as any);
      const valid = this.validate(many.nodes);

      return { ...many, nodes: valid };
    }

    async createOne(input: any): Promise<To> {
      if (DTOCls) {
        // TODO add validation with CreateOneDTO
        const newOne = transformAndValidate(DTOCls, input as any);
        return transformAndValidate(DTOCls, (await this.grpcSvc.createOne(newOne)) as any);
      }
      return (await this.grpcSvc.createOne(input)) as To;
    }

    async deleteOne(id: string | FindOptionsWhere<To>): Promise<boolean> {
      await this.grpcSvc.deleteOne(id);
      return true;
    }

    async updateOne(
      idOrConditions: string | FindOptionsWhere<To>,
      partialEntity: QueryDeepPartialEntity<To>,
      // ...options: any[]
    ): Promise<boolean> {
      const update: any = { ...partialEntity, id: idOrConditions };
      const updateMask = { paths: generateFieldMask(update) };

      await this.grpcSvc.updateOne({
        update,
        updateMask,
      });
      return true;
    }

    async findOne(
      id: string | FindOneOptions<To> | FindOptionsWhere<To>,
      options?: FindOneOptions<To>,
    ): Promise<To> {
      return this.grpcSvc.findOne({ id } as any) as any;
    }

    async count(filter?: FindManyOptions<To>): Promise<number> {
      const { totalCount } = await this.grpcSvc.findMany(filter as any);
      return totalCount;
    }

    convertDtoInputToGrpc(input: FindManyOptions<To>): FindManyOptions<From> {
      return input as any;
    }
  }
  renameFunc(GenericGrpcService, serviceName);

  return GenericGrpcService as any;
}
