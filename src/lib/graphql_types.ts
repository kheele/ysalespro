
export type GraphQLListArg = {
  query: string;
  operationName: string;
  variables?: any;
};

export type GraphQLOneArg = {
  query: string;
  operationName: string;
  variables: any;
  multi_queries?: boolean;
  count?: boolean;
};

export type GraphQLInsertArg = {
  mutation: string;
  operationName: string;
  input: any;
  variables?: any;
  auth?: any;
};

export type GraphQLUpdateArg = {
  mutation: string;
  operationName: string;
  id: number | string;
  attrs?: any;
  auth?: any;
};

export type GraphQLDeleteArg = {
  mutation: string;
  operationName: string;
  id: number | string;
  auth?: any;
  variables?: any;
};
