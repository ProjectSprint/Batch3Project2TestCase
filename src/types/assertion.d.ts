// Using specific types from k6 where possible
import { JSONValue } from 'k6';
import { RefinedResponse, ResponseType } from './k6-http.js';

/**
 * Type definition for a single checker function.
 * It receives the pre-parsed JSON body (or null if parsing failed)
 * and the original k6 response object.
 * @template TResponse The specific type of the k6 response object (defaults to RefinedResponse<ResponseType>).
 * @template TParsed The specific type of the parsed JSON body (defaults to JSONValue).
 * @param {TParsed | null} parsedJson The parsed JSON body, or null if parsing failed.
 * @param {TResponse} response The original k6 response object.
 * @returns {boolean} True if the check passes, false otherwise.
 */
export type Checker = (parsedJson: JSONValue | null, response: RefinedResponse<ResponseType>) => boolean;

/**
 * Type definition for the collection of checks passed to the assert function.
 * Keys are descriptive messages, values are Checker functions.
 * @template TResponse The type of the k6 response object.
 * @template TParsed The type of the parsed JSON body.
 */
export type Checkers = Record<string, Checker>;
