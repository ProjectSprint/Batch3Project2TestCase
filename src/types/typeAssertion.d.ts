export interface ValidationError {
  path: string;
  message: string;
  value: any;
  schemaPath: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationContext {
  definitions: Record<string, JSONSchemaDefinition>;
  rootSchema: JSONSchemaDefinition;
}

export interface JSONSchemaDefinition {
  // Basic type validation
  type?: string | string[];
  enum?: any[];
  const?: any;

  // Schema composition
  oneOf?: JSONSchemaDefinition[];
  anyOf?: JSONSchemaDefinition[];
  allOf?: JSONSchemaDefinition[];
  not?: JSONSchemaDefinition;

  // Object validation
  properties?: Record<string, JSONSchemaDefinition>;
  additionalProperties?: boolean | JSONSchemaDefinition;
  required?: string[];
  patternProperties?: Record<string, JSONSchemaDefinition>;
  minProperties?: number;
  maxProperties?: number;
  propertyNames?: JSONSchemaDefinition;
  dependencies?: Record<string, string[] | JSONSchemaDefinition>;

  // Array validation
  items?: JSONSchemaDefinition | JSONSchemaDefinition[];
  additionalItems?: boolean | JSONSchemaDefinition;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  contains?: JSONSchemaDefinition;

  // String validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Number validation
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;

  // Schema references
  $ref?: string;
  $id?: string;
  $schema?: string;
  $comment?: string;
  definitions?: Record<string, JSONSchemaDefinition>;

  // Metadata
  title?: string;
  description?: string;
  default?: any;
  examples?: any[];
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;

  // Conditional schema
  if?: JSONSchemaDefinition;
  then?: JSONSchemaDefinition;
  else?: JSONSchemaDefinition;
}
