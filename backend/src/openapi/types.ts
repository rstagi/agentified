// Pure domain types - no dependencies

export type OpenAPISpec = {
  id: string;
  name: string;
  spec: unknown; // The raw OpenAPI spec object
  createdAt: Date;
};

export type CreateOpenAPISpec = {
  name: string;
  spec: unknown;
};
