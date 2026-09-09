export type Transformer<TApi, TApp> = {
  fromApi: (data: TApi) => TApp;
  toApi: (data: TApp) => TApi;
};
