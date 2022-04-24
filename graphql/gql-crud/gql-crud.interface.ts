import { Type } from '@nestjs/common';
import { ModuleImportElem } from '@bits/bits.types';
import { IFilter } from '@bits/graphql/filter/filter.interface';

export interface GqlWritableCrudConfig<M> {
  imports?: ModuleImportElem[];
  Model: Type<M>;
  modelName?: string;
  pagination?: boolean;
  grpcServiceName?: string;
  ModelResolver?: any;
  Service?: Type<any>;
}

export interface Connection<T> {
  totalCount: number;
  nodes: T[];
}

export interface IUpdateOneInput<T> {
  id: string;
  update: Partial<T>;
}

export interface IFindManyArgs<T> {
  filter?: IFilter<T>;
}
