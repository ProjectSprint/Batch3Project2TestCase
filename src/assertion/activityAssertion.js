import { combine } from "../helper/generator.js";
import { createValidator } from "../helper/typeAssertion.js";

const activitySchema = open("../schemas/activity.schema.json");
const isValid = createValidator(activitySchema);

// hasil open adalah string, replace aja kebutuhannya apa
const isProductsValid = createValidator(
  activitySchema.replace("#/definitions/Activity", "#/definitions/Activities"),
);

/**
 * Asserts that a value is a valid User object
 * @param {any} value - The value to assert
 * @returns {value is import("src/entity/app.js").Activity}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isActivity(value) {
  const obj = value;
  const res = isValid(obj);
  if (res.valid) {
    return true;
  }
  throw res.errors;
}

/**
 * Asserts that a value is a valid User object
 * @param {any} value - The value to assert
 * @returns {value is import("src/entity/app.js").Activity[]}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isActivities(value) {
  const obj = value;
  const res = isProductsValid(obj);
  if (res.valid) {
    return true;
  }
  throw res.errors;
}

/**
 * @param {import("k6/http").RefinedResponse<any>} res
 * @param {any} positivePayload
 * @param {string} featureName
 * @returns {import('src/entity/app.js').Activity | undefined}
 */
export function getActivity(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      obj = combine(jsonResult, positivePayload);
      if (isActivity(obj)) {
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

/**
 * @param {import("k6/http").RefinedResponse<any>} res
 * @param {any} positivePayload
 * @param {string} featureName
 * @returns {import('src/entity/app.js').Activity[] | undefined}
 */
export function getActivitites(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      // obj = combine(jsonResult, positivePayload);

      obj = jsonResult;
      if (isActivities(obj)) {
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
