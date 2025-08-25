import { combine } from "../helper/generator.js";
import { createValidator } from "../helper/typeAssertion.js";

const fileSchema = open("../schemas/File.schema.json");
const isValid = createValidator(fileSchema);

/**
 * Asserts that a value is a valid User object
 * @param {any} value - The value to assert
 * @returns {value is import("src/entity/app.js").UploadedFile}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isFile(value) {
  const res = isValid(value);
  if (res.valid) {
    return true;
  }
  throw res.errors;
}

/**
 * @param {import("k6/http").RefinedResponse<any>} res
 * @param {any} positivePayload
 * @param {string} featureName
 * @returns {import('src/entity/app.js').UploadedFile | undefined}
 */
export function getFile(res, positivePayload, featureName) {
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      const obj = combine(jsonResult, positivePayload);
      if (isFile(obj)) {
        return obj;
      }
      console.log(featureName + " | object is not matching schema", obj);
      return;
    }
    console.log(featureName + " | json is not object", jsonResult);
    return;
  } catch (e) {
    console.log(
      featureName + " | json or validation error:",
      e,
      "body:",
      res.body,
    );
    return;
  }
}
