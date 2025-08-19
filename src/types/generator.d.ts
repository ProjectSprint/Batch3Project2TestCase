import { RefinedResponse, ResponseType, StructuredRequestBody } from "./k6-http";
import { Checkers } from "./k6";
import { Config } from "../entity/config";
import { JSONValue } from "k6";

export type TestObjectSchema = {
  notNull?: boolean;
  isUrl?: boolean;
  isEmail?: boolean;
  isPhoneNumber?: boolean;
  addPlusPrefixPhoneNumber?: boolean;
  type?: "string" | "string-param" | "number" | "boolean" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: readonly string[];
  items?: TestObjectSchema;
  properties?: Record<string, TestObjectSchema>;
};

export type GenerateTestObjectSchema = Record<string, TestObjectSchema>;

export type GenerateUrlParamFromObjSchema = Record<string, string | number | boolean>;
