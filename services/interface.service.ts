import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { NestedFindManyOpts } from '@bits/db/repo.interface';
import { IConnection } from '@bits/bits.types';

export type IServiceWhere<T> = FindOptionsWhere<T> & {
  AND: IServiceWhere<T>[];
  OR: IServiceWhere<T>[];
};

export interface IFindManyServiceInput<T> extends Omit<FindManyOptions, 'where'> {
  where?: IServiceWhere<T>;
}

export interface IReadableCrudService<Entity extends ObjectLiteral> {
  // readRepo: IReadableRepo<Entity>;
  count(filter?: FindManyOptions<Entity>): Promise<number>;
  findMany(filter?: FindManyOptions<Entity>): Promise<Entity[]>;
  findManyAndCount(filter?: NestedFindManyOpts<Entity>): Promise<IConnection<Entity>>;
  findOne(
    id: FindOneOptions<Entity> | FindOptionsWhere<Entity>,
    options?: FindOneOptions<Entity>,
  ): Promise<Entity>;
  getPrimaryColumnName(): keyof Entity;
}

export interface IWritableCrudService<Entity extends ObjectLiteral> {
  // writeRepo: IWritableRepo<Entity>;
  createOne(newEntity: DeepPartial<Entity>): Promise<Entity>;
  deleteOne(id: string | FindOptionsWhere<Entity>): Promise<boolean>;
  updateOne(
    idOrConditions: string | FindOptionsWhere<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
    // ...options: any[]
  ): Promise<boolean>;
}

export type ICrudService<Entity extends ObjectLiteral> = IWritableCrudService<Entity> &
  IReadableCrudService<Entity>;
