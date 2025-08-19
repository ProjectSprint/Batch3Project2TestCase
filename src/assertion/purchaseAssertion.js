import { combine } from "../helper/generator.js";
import { createValidator } from "../helper/typeAssertion.js";

const purchaseRequestSchema = open("../schemas/PurchaseRequest.schema.json");
const purchaseSchema = open("../schemas/purchase.schema.json");

const isValid = createValidator(purchaseRequestSchema);
const isResponseValid = createValidator(purchaseSchema);

/**
 * Asserts that a value is a valid User object
 * @param {any} value - The value to assert
 * @returns {value is import("src/entity/app.js").PurchaseRequest}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isPurchaseRequest(value) {
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
 * @returns {value is import("src/entity/app.js").PurchaseResponse}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isPurchaseResponse(value) {
  const obj = value;
  const res = isResponseValid(obj);
  if (res.valid) {
    return true;
  }
  throw res.errors;
}

/**
 * @param {import("k6/http").RefinedResponse<any>} res
 * @param {any} positivePayload
 * @param {string} featureName
 * @returns {import('src/entity/app.js').PurchaseRequest | undefined}
 */
export function getPurchaseRequest(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      obj = combine(jsonResult, positivePayload);
      if (isPurchaseRequest(obj)) {
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
 * @returns {import('src/entity/app.js').PurchaseResponse | undefined}
 */
export function getPurchaseResponse(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      obj = combine(jsonResult, positivePayload);
      if (isPurchaseResponse(obj)) {
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