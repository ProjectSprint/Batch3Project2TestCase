/**
 * Validation error structure
 * @typedef {Object} ValidationError
 * @property {string} path - JSON path to the invalid value
 * @property {string} message - Human-readable error message
 * @property {any} value - The invalid value
 * @property {string} schemaPath - Path to the schema rule that failed
 */

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} errors - Array of validation errors
 */

/**
 * Creates a validator function based on a JSON schema string
 * @param {string} schemaString - JSON schema as a string
 * @returns {function(any): ValidationResult} - Validation function
 * @throws {Error} If the schema string is invalid JSON
 */
export function createValidator(schemaString) {
  let schema;
  try {
    schema = JSON.parse(schemaString);
  } catch (error) {
    throw new Error(`Invalid JSON schema string: ${error}`);
  }

  /** @type {import('src/types/typeAssertion.d.ts').ValidationContext} */
  const context = {
    definitions: schema.definitions ? { ...schema.definitions } : {},
    rootSchema: schema,
  };

  return function validate(value) {
    /** @type {ValidationError[]} */
    const errors = [];
    const resolvedSchema = resolveSchema(schema, context);
    validateAgainstSchema(value, resolvedSchema, context, "", "#", errors);

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  };
}

/**
 * @param {import('src/types/typeAssertion.js').JSONSchemaDefinition} schema
 * @param {import('src/types/typeAssertion.d.ts').ValidationContext} context
 * @returns {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition}
 */
function resolveSchema(schema, context) {
  if (schema.$ref) {
    const path = schema.$ref.split("/");
    /** @type {Record<string, any>} */
    let currentSchema = context.rootSchema;

    const startIndex = path[0] === "#" ? 1 : 0;

    for (let i = startIndex; i < path.length; i++) {
      const segment = path[i];
      if (typeof currentSchema !== "object" || currentSchema === null) {
        throw new Error(`Invalid reference path: ${schema.$ref}`);
      }
      currentSchema = currentSchema[segment];
      if (!currentSchema) {
        throw new Error(`Invalid reference: ${schema.$ref}`);
      }
    }

    if (currentSchema.$ref) {
      return resolveSchema(
        /** @type {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} */ (
          currentSchema
        ),
        context,
      );
    }

    return /** @type {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} */ (
      currentSchema
    );
  }

  return schema;
}

/**
 * @param {any} value
 * @param {string} type
 * @returns {boolean}
 */
function validateType(value, type) {
  switch (type) {
    case "object":
      return (
        typeof value === "object" && value !== null && !Array.isArray(value)
      );
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return false;
  }
}

/**
 * Validates format constraints for strings
 * @param {string} value
 * @param {string} format
 * @returns {boolean}
 */
function validateFormat(value, format) {
  if (typeof value !== "string") return false;

  switch (format) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "uri":
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case "date":
      return !isNaN(Date.parse(value));
    case "date-time":
      return !isNaN(Date.parse(value));
    default:
      return true;
  }
}

/**
 * @param {any} value
 * @param {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} schema
 * @param {import('src/types/typeAssertion.d.ts').ValidationContext} context
 * @param {string} path - Current JSON path
 * @param {string} schemaPath - Current schema path
 * @param {ValidationError[]} errors - Array to collect errors
 */
function validateAgainstSchema(
  value,
  schema,
  context,
  path,
  schemaPath,
  errors,
) {
  // Handle null values
  if (value === null) {
    if (Array.isArray(schema.type)) {
      if (!schema.type.includes("null")) {
        errors.push({
          path: path,
          message: `Expected one of types [${schema.type.join(", ")}] but got null`,
          value: value,
          schemaPath: `${schemaPath}/type`,
        });
      }
    } else if (schema.type !== "null") {
      errors.push({
        path: path,
        message: `Expected type ${schema.type} but got null`,
        value: value,
        schemaPath: `${schemaPath}/type`,
      });
    }
    return;
  }

  // Handle undefined values
  if (value === undefined) {
    errors.push({
      path: path,
      message: "Value is undefined",
      value: value,
      schemaPath: schemaPath,
    });
    return;
  }

  // Handle oneOf
  if (schema.oneOf) {
    const validSchemas = [];
    const oneOfErrors = [];

    schema.oneOf.forEach((subSchema, index) => {
      /** @type {ValidationError[]} */
      const subErrors = [];
      validateAgainstSchema(
        value,
        resolveSchema(subSchema, context),
        context,
        path,
        `${schemaPath}/oneOf/${index}`,
        subErrors,
      );

      if (subErrors.length === 0) {
        validSchemas.push(index);
      } else {
        oneOfErrors.push(...subErrors);
      }
    });

    if (validSchemas.length !== 1) {
      errors.push({
        path: path,
        message: `Expected exactly one schema to match, but ${validSchemas.length} schemas matched`,
        value: value,
        schemaPath: `${schemaPath}/oneOf`,
      });
    }
  }

  // Handle anyOf
  if (schema.anyOf) {
    /** @type {ValidationError[]} */
    const anyOfErrors = [];
    let hasValid = false;

    schema.anyOf.forEach((subSchema, index) => {
      /** @type {ValidationError[]} */
      const subErrors = [];
      validateAgainstSchema(
        value,
        resolveSchema(subSchema, context),
        context,
        path,
        `${schemaPath}/anyOf/${index}`,
        subErrors,
      );

      if (subErrors.length === 0) {
        hasValid = true;
      } else {
        anyOfErrors.push(...subErrors);
      }
    });

    if (!hasValid) {
      errors.push({
        path: path,
        message: "Value does not match any of the expected schemas",
        value: value,
        schemaPath: `${schemaPath}/anyOf`,
      });
    }
  }

  // Handle allOf
  if (schema.allOf) {
    schema.allOf.forEach((subSchema, index) => {
      validateAgainstSchema(
        value,
        resolveSchema(subSchema, context),
        context,
        path,
        `${schemaPath}/allOf/${index}`,
        errors,
      );
    });
  }

  // Handle enum
  if (schema.enum) {
    if (!schema.enum.includes(value)) {
      errors.push({
        path: path,
        message: `Value must be one of: ${JSON.stringify(schema.enum)}`,
        value: value,
        schemaPath: `${schemaPath}/enum`,
      });
    }
  }

  // Handle const
  if (schema.const !== undefined) {
    if (value !== schema.const) {
      errors.push({
        path: path,
        message: `Value must be exactly: ${JSON.stringify(schema.const)}`,
        value: value,
        schemaPath: `${schemaPath}/const`,
      });
    }
  }

  // Handle type validation
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    let matchesType = false;

    for (const type of types) {
      if (validateType(value, type)) {
        // Type matches, now check type-specific constraints
        switch (type) {
          case "object":
            validateObject(value, schema, context, path, schemaPath, errors);
            matchesType = true;
            break;
          case "array":
            validateArray(value, schema, context, path, schemaPath, errors);
            matchesType = true;
            break;
          case "string":
            validateString(value, schema, path, schemaPath, errors);
            matchesType = true;
            break;
          case "number":
          case "integer":
            validateNumber(
              value,
              schema,
              type === "integer",
              path,
              schemaPath,
              errors,
            );
            matchesType = true;
            break;
          default:
            matchesType = true;
        }
        break;
      }
    }

    if (!matchesType) {
      const actualType = Array.isArray(value)
        ? "array"
        : value === null
          ? "null"
          : typeof value;
      errors.push({
        path: path,
        message: `Expected type ${types.length > 1 ? `[${types.join(", ")}]` : types[0]} but got ${actualType}`,
        value: value,
        schemaPath: `${schemaPath}/type`,
      });
    }
  }

  // If no type is specified but has type-specific properties, infer validation
  if (!schema.type) {
    if (schema.properties || schema.additionalProperties !== undefined) {
      validateObject(value, schema, context, path, schemaPath, errors);
    }
    if (schema.items !== undefined) {
      validateArray(value, schema, context, path, schemaPath, errors);
    }
  }
}

/**
 * Validates string constraints
 * @param {any} value
 * @param {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} schema
 * @param {string} path
 * @param {string} schemaPath
 * @param {ValidationError[]} errors
 */
function validateString(value, schema, path, schemaPath, errors) {
  if (typeof value !== "string") return;

  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({
      path: path,
      message: `String length ${value.length} is less than minimum ${schema.minLength}`,
      value: value,
      schemaPath: `${schemaPath}/minLength`,
    });
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({
      path: path,
      message: `String length ${value.length} exceeds maximum ${schema.maxLength}`,
      value: value,
      schemaPath: `${schemaPath}/maxLength`,
    });
  }

  if (schema.pattern) {
    try {
      if (!new RegExp(schema.pattern).test(value)) {
        errors.push({
          path: path,
          message: `String does not match pattern: ${schema.pattern}`,
          value: value,
          schemaPath: `${schemaPath}/pattern`,
        });
      }
    } catch (e) {
      errors.push({
        path: path,
        message: `Invalid regex pattern: ${schema.pattern}`,
        value: value,
        schemaPath: `${schemaPath}/pattern`,
      });
    }
  }

  if (schema.format && !validateFormat(value, schema.format)) {
    errors.push({
      path: path,
      message: `String does not match format: ${schema.format}`,
      value: value,
      schemaPath: `${schemaPath}/format`,
    });
  }
}

/**
 * Validates number constraints
 * @param {any} value
 * @param {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} schema
 * @param {boolean} mustBeInteger
 * @param {string} path
 * @param {string} schemaPath
 * @param {ValidationError[]} errors
 */
function validateNumber(
  value,
  schema,
  mustBeInteger,
  path,
  schemaPath,
  errors,
) {
  if (typeof value !== "number" || isNaN(value)) return;

  if (mustBeInteger && !Number.isInteger(value)) {
    errors.push({
      path: path,
      message: `Expected integer but got ${value}`,
      value: value,
      schemaPath: `${schemaPath}/type`,
    });
  }

  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push({
      path: path,
      message: `Value ${value} is less than minimum ${schema.minimum}`,
      value: value,
      schemaPath: `${schemaPath}/minimum`,
    });
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push({
      path: path,
      message: `Value ${value} exceeds maximum ${schema.maximum}`,
      value: value,
      schemaPath: `${schemaPath}/maximum`,
    });
  }

  // Handle exclusiveMinimum (can be boolean or number)
  if (schema.exclusiveMinimum !== undefined) {
    if (typeof schema.exclusiveMinimum === "boolean") {
      if (
        schema.exclusiveMinimum &&
        schema.minimum !== undefined &&
        value <= schema.minimum
      ) {
        errors.push({
          path: path,
          message: `Value ${value} must be greater than ${schema.minimum}`,
          value: value,
          schemaPath: `${schemaPath}/exclusiveMinimum`,
        });
      }
    } else {
      if (value <= schema.exclusiveMinimum) {
        errors.push({
          path: path,
          message: `Value ${value} must be greater than ${schema.exclusiveMinimum}`,
          value: value,
          schemaPath: `${schemaPath}/exclusiveMinimum`,
        });
      }
    }
  }

  // Handle exclusiveMaximum (can be boolean or number)
  if (schema.exclusiveMaximum !== undefined) {
    if (typeof schema.exclusiveMaximum === "boolean") {
      if (
        schema.exclusiveMaximum &&
        schema.maximum !== undefined &&
        value >= schema.maximum
      ) {
        errors.push({
          path: path,
          message: `Value ${value} must be less than ${schema.maximum}`,
          value: value,
          schemaPath: `${schemaPath}/exclusiveMaximum`,
        });
      }
    } else {
      if (value >= schema.exclusiveMaximum) {
        errors.push({
          path: path,
          message: `Value ${value} must be less than ${schema.exclusiveMaximum}`,
          value: value,
          schemaPath: `${schemaPath}/exclusiveMaximum`,
        });
      }
    }
  }

  if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
    errors.push({
      path: path,
      message: `Value ${value} is not a multiple of ${schema.multipleOf}`,
      value: value,
      schemaPath: `${schemaPath}/multipleOf`,
    });
  }
}

/**
 * @param {any} value
 * @param {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} schema
 * @param {import('src/types/typeAssertion.d.ts').ValidationContext} context
 * @param {string} path
 * @param {string} schemaPath
 * @param {ValidationError[]} errors
 */
function validateObject(value, schema, context, path, schemaPath, errors) {
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    return;
  }

  // Check required properties
  if (schema.required) {
    for (const requiredProp of schema.required) {
      if (!(requiredProp in value)) {
        errors.push({
          path: path ? `${path}.${requiredProp}` : requiredProp,
          message: `Missing required property: ${requiredProp}`,
          value: undefined,
          schemaPath: `${schemaPath}/required`,
        });
      }
    }
  }

  // Check property count constraints
  const propertyCount = Object.keys(value).length;
  if (
    schema.minProperties !== undefined &&
    propertyCount < schema.minProperties
  ) {
    errors.push({
      path: path,
      message: `Object has ${propertyCount} properties, minimum ${schema.minProperties} required`,
      value: value,
      schemaPath: `${schemaPath}/minProperties`,
    });
  }

  if (
    schema.maxProperties !== undefined &&
    propertyCount > schema.maxProperties
  ) {
    errors.push({
      path: path,
      message: `Object has ${propertyCount} properties, maximum ${schema.maxProperties} allowed`,
      value: value,
      schemaPath: `${schemaPath}/maxProperties`,
    });
  }

  // Validate defined properties
  if (schema.properties) {
    for (const [prop, propValue] of Object.entries(value)) {
      if (prop in schema.properties) {
        const propSchema = schema.properties[prop];
        const propPath = path ? `${path}.${prop}` : prop;
        validateAgainstSchema(
          propValue,
          resolveSchema(propSchema, context),
          context,
          propPath,
          `${schemaPath}/properties/${prop}`,
          errors,
        );
      }
    }
  }

  // Check additional properties
  if (schema.additionalProperties !== undefined) {
    const definedProps = Object.keys(schema.properties || {});
    const patternProps = Object.keys(schema.patternProperties || {});

    for (const [prop, propValue] of Object.entries(value)) {
      // Skip if property is defined in properties
      if (definedProps.includes(prop)) continue;

      // Skip if property matches a pattern property
      let matchesPattern = false;
      for (const pattern of patternProps) {
        if (new RegExp(pattern).test(prop)) {
          matchesPattern = true;
          break;
        }
      }
      if (matchesPattern) continue;

      // This is an additional property
      if (schema.additionalProperties === false) {
        errors.push({
          path: path ? `${path}.${prop}` : prop,
          message: `Additional property '${prop}' is not allowed`,
          value: propValue,
          schemaPath: `${schemaPath}/additionalProperties`,
        });
      } else if (typeof schema.additionalProperties === "object") {
        const propPath = path ? `${path}.${prop}` : prop;
        validateAgainstSchema(
          propValue,
          resolveSchema(schema.additionalProperties, context),
          context,
          propPath,
          `${schemaPath}/additionalProperties`,
          errors,
        );
      }
    }
  }

  // Check patternProperties
  if (schema.patternProperties) {
    for (const [pattern, patternSchema] of Object.entries(
      schema.patternProperties,
    )) {
      const regex = new RegExp(pattern);
      for (const [prop, propValue] of Object.entries(value)) {
        if (regex.test(prop)) {
          const propPath = path ? `${path}.${prop}` : prop;
          validateAgainstSchema(
            propValue,
            resolveSchema(patternSchema, context),
            context,
            propPath,
            `${schemaPath}/patternProperties/${pattern}`,
            errors,
          );
        }
      }
    }
  }
}

/**
 * @param {any} value
 * @param {import('src/types/typeAssertion.d.ts').JSONSchemaDefinition} schema
 * @param {import('src/types/typeAssertion.d.ts').ValidationContext} context
 * @param {string} path
 * @param {string} schemaPath
 * @param {ValidationError[]} errors
 */
function validateArray(value, schema, context, path, schemaPath, errors) {
  if (!Array.isArray(value)) {
    return;
  }

  // Check array length constraints
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push({
      path: path,
      message: `Array length ${value.length} is less than minimum ${schema.minItems}`,
      value: value,
      schemaPath: `${schemaPath}/minItems`,
    });
  }

  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push({
      path: path,
      message: `Array length ${value.length} exceeds maximum ${schema.maxItems}`,
      value: value,
      schemaPath: `${schemaPath}/maxItems`,
    });
  }

  // Check uniqueItems
  if (schema.uniqueItems) {
    const seen = new Set();
    const duplicates = [];

    for (let i = 0; i < value.length; i++) {
      const key = JSON.stringify(value[i]);
      if (seen.has(key)) {
        duplicates.push(i);
      }
      seen.add(key);
    }

    if (duplicates.length > 0) {
      errors.push({
        path: path,
        message: `Array contains duplicate items at indices: ${duplicates.join(", ")}`,
        value: value,
        schemaPath: `${schemaPath}/uniqueItems`,
      });
    }
  }

  // Validate items
  if (schema.items !== undefined) {
    if (Array.isArray(schema.items)) {
      // Tuple validation
      for (let i = 0; i < value.length; i++) {
        const itemPath = `${path}[${i}]`;

        if (i < schema.items.length) {
          validateAgainstSchema(
            value[i],
            resolveSchema(schema.items[i], context),
            context,
            itemPath,
            `${schemaPath}/items/${i}`,
            errors,
          );
        } else if (schema.additionalItems !== undefined) {
          if (schema.additionalItems === false) {
            errors.push({
              path: itemPath,
              message: `Additional items are not allowed`,
              value: value[i],
              schemaPath: `${schemaPath}/additionalItems`,
            });
          } else if (typeof schema.additionalItems === "object") {
            validateAgainstSchema(
              value[i],
              resolveSchema(schema.additionalItems, context),
              context,
              itemPath,
              `${schemaPath}/additionalItems`,
              errors,
            );
          }
        }
      }
    } else {
      // All items must match the same schema
      const itemsSchema = resolveSchema(schema.items, context);
      for (let i = 0; i < value.length; i++) {
        validateAgainstSchema(
          value[i],
          itemsSchema,
          context,
          `${path}[${i}]`,
          `${schemaPath}/items`,
          errors,
        );
      }
    }
  }

  // Check contains
  if (schema.contains) {
    const containsSchema = resolveSchema(schema.contains, context);
    let hasMatch = false;

    for (let i = 0; i < value.length; i++) {
      /** @type {ValidationError[]} */
      const itemErrors = [];
      validateAgainstSchema(
        value[i],
        containsSchema,
        context,
        `${path}[${i}]`,
        `${schemaPath}/contains`,
        itemErrors,
      );

      if (itemErrors.length === 0) {
        hasMatch = true;
        break;
      }
    }

    if (!hasMatch) {
      errors.push({
        path: path,
        message: `Array does not contain any item matching the expected schema`,
        value: value,
        schemaPath: `${schemaPath}/contains`,
      });
    }
  }
}
