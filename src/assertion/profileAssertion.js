import { combine } from "../helper/generator.js";
import { createValidator } from "../helper/typeAssertion.js";

const profleSchema = open("../schemas/profile.schema.json");
const isValid = createValidator(profleSchema);

/**
 * Asserts that a value is a valid User object
 * @param {any} value - The value to assert
 * @returns {value is import("src/entity/app.js").Profile}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isProfile(value) {
  const obj = value;
  const res = isValid(obj);
  if (res.valid) {
    return true;
  }
  throw res.errors;
}

/**
 * @param {import("k6/http").RefinedResponse<any>} res
 * @param {any} positivePayload
 * @param {string} featureName
 * @returns {import('src/entity/app.js').Profile | undefined}
 */
export function getProfile(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      obj = combine(jsonResult, positivePayload);
      if (isProfile(obj)) {
        return obj;
      }
      console.log(featureName + " | object is not matching schema", obj);
      return;
    }
    console.log(featureName + " | json is not object", jsonResult);
    return;
  } catch (e) {
    console.log(featureName + " | json or validation error:", e, "body:", obj);
    return;
  }
}
