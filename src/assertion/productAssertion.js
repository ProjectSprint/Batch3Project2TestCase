import { combine } from "../helper/generator.js";
import { createValidator } from "../helper/typeAssertion.js";

const productSchema = open("../schemas/product.schema.json");
const isValid = createValidator(productSchema);
const isProductsValid = createValidator(productSchema.replace("#/definitions/Product", "#/definitions/Products"));

/**
 * Asserts that a value is a valid User object
 * @param {any} value - The value to assert
 * @returns {value is import("src/entity/app.js").Product}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isProduct(value) {
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
 * @returns {value is import("src/entity/app.js").Product[]}
 * @throws {import("src/types/typeAssertion.js").ValidationError[]}
 */
export function isProducts(value) {
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
 * @returns {import('src/entity/app.js').Product | undefined}
 */
export function getProduct(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {
      obj = combine(jsonResult, positivePayload);
      if (isProduct(obj)) {
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
 * @returns {import('src/entity/app.js').Product[] | undefined}
 */
export function getProducts(res, positivePayload, featureName) {
  let obj;
  try {
    const jsonResult = res.json();
    if (jsonResult && typeof jsonResult == "object") {

      // blocker: bentuk setelah combine() seharusnya tetap array, yang terjadi adalah mengubah menjadi map
      // obj = combine(jsonResult, positivePayload);

      obj = jsonResult;
      if (isProducts(obj)) {
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