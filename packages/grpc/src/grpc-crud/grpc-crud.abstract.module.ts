import { DynamicModule, Module, Type } from "@nestjs/common";
import { ObjectLiteral, renameFunc } from "@bits/core";
import { ReadableRepoMixin, WritableRepoMixin } from "@bits/db";
import { getRepositoryToken } from "@bits/db/lib/decorators";
import { ICrudModuleProvider } from "@bits/backend";

export class GRPCCrudModuleBuilder {
  static makeAndProvideRepo<M extends ObjectLiteral>(
    Model: Type<M>,
    dataProvider: ICrudModuleProvider<M>,
    write: boolean = true
  ): DynamicModule {
    const Repo = write
      ? WritableRepoMixin(Model)(ReadableRepoMixin(Model)())
      : ReadableRepoMixin(Model)();

    renameFunc(Repo, `${Model.name}Repo`);

    const token = getRepositoryToken(Model);

    return {
      global: true,
      module: GRPCCrudModuleBuilder,
      imports: dataProvider.getImports(Model),
      providers: [{ provide: token, useClass: Repo }],
      exports: [token],
    };
  }
}

export abstract class GRPCCrudModule {
  getModule(
    name: string,
    Repo: any,
    Service: any,
    Controller: any,
    providers: any[],
    imports: any[],
    exports?: any[]
  ) {
    @Module({
      providers: [Repo, Service, ...providers],
      controllers: [Controller],
      imports,
      exports: exports || [Repo, Service],
    })
    class GrpcCrudModule {}
    renameFunc(GrpcCrudModule, `GrpcCrud${name}Module`);

    return GrpcCrudModule as any;
  }
}
