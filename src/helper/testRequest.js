import http from "k6/http";
import { getAssertChecks } from "./assertion.js"; // Adjust path if needed
import { generateUrlParamFromObj } from "./generator.js"; // Adjust path if needed
import { check } from "k6";

/**
 * Sends a Get request with JSON data to the specified route.
 * @param {string} route - The route to send the request to.
 * @param {import('../types/testRequest.d.ts').Params} params - The params that will be parsed into the URL.
 * @param {{[name: string]: string}} headersObj - Request headers.
 * @param {{[name: string]: string}} tags - Request tags.
 * @returns {import("k6/http").RefinedResponse<any>} - k6 http response.
 */
export function testGet(route, params, headersObj = {}, tags = {}) {
  const queryParams = generateUrlParamFromObj(params);
  const modifiedRoute = route + "?" + queryParams;

  const requestParams = { headers: headersObj, tags: tags };
  return http.get(modifiedRoute, requestParams);
}

/**
 * Sends a POST request with Multipart data to the specified route.
 * @param {string} route - The route to send the request to.
 * @param {import("k6/http").StructuredRequestBody} body - The request body data
 * @param {{ [name: string]: string }} headers - External headers other than `Content-Type`
 * @param {{ [name: string]: string }} tags - Tags for the request
 * @returns {import("k6/http").RefinedResponse<any>} - k6 http response.
 */
export function testPostMultipart(route, body, headers = {}, tags = {}) {
  const requestParams = { headers: headers, tags: tags };
  return http.post(route, body, requestParams);
}

/**
 * Sends a POST request with JSON data to the specified route.
 * @param {string} route - The route to send the request to.
 * @param {string | import("k6").JSONValue} body - The request body data
 * @param {{ [name: string]: string }} headers - Request headers.
 * @param {{ [name: string]: string }} tags - Tags for the request
 * @param {import('../types/testRequest.d.ts').RequestBodyOptions[]} options - Additional options for the request.
 * @returns {import("k6/http").RefinedResponse<any>} - k6 http response.
 */
export function testPostJson(
  route,
  body,
  headers = {},
  tags = {},
  options = [],
) {
  let parsedBody =
    typeof body === "string" && options.includes("plainBody")
      ? body
      : JSON.stringify(body);

  const requestParams = { headers: headers, tags: tags };
  return http.post(route, parsedBody, requestParams);
}

/**
 * Sends a PATCH request with JSON data to the specified route.
 * @param {string} route - The route to send the request to.
 * @param {string | import("k6").JSONValue} body - The JSON data to send in the request body.
 * @param {{[name: string]: string}} headers - Request headers.
 * @param {{[name: string]: string}} tags - Request tags.
 * @param {import('../types/testRequest.d.ts').RequestBodyOptions[]} options - Additional options for the request.
 * @returns {import("k6/http").RefinedResponse<any>} - k6 http response.
 */
export function testPatchJson(
  route,
  body,
  headers = {},
  tags = {},
  options = [],
) {
  let parsedBody =
    typeof body === "string" && options.includes("plainBody")
      ? body
      : JSON.stringify(body);

  const requestParams = { headers: headers, tags: tags };
  return http.patch(route, parsedBody, requestParams);
}

/**
 * Sends a PUT request with JSON data to the specified route.
 * @param {string} route - The route to send the request to.
 * @param {string | import("k6").JSONValue} body - The JSON data to send in the request body.
 * @param {{[name: string]: string}} headers - Request headers.
 * @param {{[name: string]: string}} tags - Request tags.
 * @param {import('../types/testRequest.d.ts').RequestBodyOptions[]} options - Additional options for the request.
 * @returns {import("k6/http").RefinedResponse<any>} - k6 http response.
 */
export function testPutJson(
  route,
  body,
  headers = {},
  tags = {},
  options = [],
) {
  let parsedBody =
    typeof body === "string" && options.includes("plainBody")
      ? body
      : JSON.stringify(body);

  const requestParams = { headers: headers, tags: tags };
  return http.put(route, parsedBody, requestParams);
}

/**
 * Sends a DELETE request to the specified route.
 * @param {string} route - The route to send the request to.
 * @param {import('../types/testRequest.d.ts').Params} params - The params that will be parsed into the URL.
 * @param {{[name: string]: string}} headersObj - Request headers.
 * @param {{[name: string]: string}} tags - Request tags.
 * @returns {import("k6/http").RefinedResponse<any>} - k6 http response.
 */
export function testDelete(route, params, headersObj = {}, tags = {}) {
  const queryParams = generateUrlParamFromObj(params);
  const modifiedRoute = route + "?" + queryParams;
  const headers = Object.assign({}, headersObj); // Keep explicit assignment for clarity / eslint rule

  const requestParams = { headers: headers, tags: tags };
  return http.del(modifiedRoute, null, requestParams); // Body is null for DELETE
}

/**
 * Sends a Get request and asserts the response using object parameters.
 * @param {import("../types/testRequest.d.ts").GetTestAssertArgs} args - Arguments for the GET request and assertion.
 * @returns {import("../types/testRequest.d.ts").RequestAssertResponse} - Assertion result and k6 http response.
 */
export function testGetAssert(args) {
  const {
    currentTestName,
    featureName,
    route,
    params,
    headers = {}, // Default optional args
    expectedCase,
    config,
    tags = {}, // Default optional args
  } = args;

  const res = testGet(route, params, headers, tags);
  const requestPayloadString = generateUrlParamFromObj(params); // As per original assert usage
  const isSuccess = check(
    res,
    getAssertChecks(
      res,
      "GET",
      requestPayloadString,
      headers,
      `${featureName} | ${currentTestName}`,
      expectedCase,
      config,
    ),
  );
  return {
    isSuccess: isSuccess,
    res: res,
  };
}

/**
 * Sends a POST Multipart request and asserts the response using object parameters.
 * @param {import("../types/testRequest.d.ts").PostMultipartTestAssertArgs} args - Arguments for the POST Multipart request and assertion.
 * @returns {import("../types/testRequest.d.ts").RequestAssertResponse} - Assertion result and k6 http response.
 */
export function testPostMultipartAssert(args) {
  const {
    currentTestName,
    featureName,
    route,
    body,
    headers = {},
    expectedCase,
    config,
    tags = {},
  } = args;

  const res = testPostMultipart(route, body, headers, tags);
  const isSuccess = check(
    res,
    getAssertChecks(
      res,
      "POST",
      body,
      headers,
      `${featureName} | ${currentTestName}`,
      expectedCase,
      config,
    ),
  );
  return {
    isSuccess: isSuccess,
    res: res,
  };
}

/**
 * Sends a POST JSON request and asserts the response using object parameters.
 * @param {import("../types/testRequest.d.ts").PostJsonTestAssertArgs} args - Arguments for the POST JSON request and assertion.
 * @returns {import("../types/testRequest.d.ts").RequestAssertResponse} - Assertion result and k6 http response.
 */
export function testPostJsonAssert(args) {
  // Destructure arguments
  const {
    currentTestName,
    featureName,
    route,
    body,
    headers: headersObj = {},
    expectedCase,
    options = [],
    config,
    tags = {},
  } = args;

  const headers = options.includes("noContentType")
    ? Object.assign({}, headersObj)
    : Object.assign({ "Content-Type": "application/json" }, headersObj);

  const res = testPostJson(route, body, headers, tags, options);
  const isSuccess = check(
    res,
    getAssertChecks(
      res,
      "POST",
      body,
      headers,
      `${featureName} | ${currentTestName}`,
      expectedCase,
      config,
    ),
  );
  return {
    isSuccess: isSuccess,
    res: res,
  };
}

/**
 * Sends a PATCH JSON request and asserts the response using object parameters.
 * @param {import("../types/testRequest.d.ts").PatchJsonTestAssertArgs} args - Arguments for the PATCH JSON request and assertion.
 * @returns {import("../types/testRequest.d.ts").RequestAssertResponse} - Assertion result and k6 http response.
 */
export function testPatchJsonAssert(args) {
  const {
    currentTestName,
    featureName,
    route,
    body,
    headers: headersObj = {},
    expectedCase,
    options = [],
    config,
    tags = {},
  } = args;

  const headers = options.includes("noContentType")
    ? Object.assign({}, headersObj)
    : Object.assign({ "Content-Type": "application/json" }, headersObj);

  const res = testPatchJson(route, body, headers, tags, options);
  const isSuccess = check(
    res,
    getAssertChecks(
      res,
      "PATCH",
      body,
      headers,
      `${featureName} | ${currentTestName}`,
      expectedCase,
      config,
    ),
  );
  return {
    isSuccess: isSuccess,
    res: res,
  };
}

/**
 * Sends a PUT JSON request and asserts the response using object parameters.
 * @param {import("../types/testRequest.d.ts").PutJsonTestAssertArgs} args - Arguments for the PUT JSON request and assertion.
 * @returns {import("../types/testRequest.d.ts").RequestAssertResponse} - Assertion result and k6 http response.
 */
export function testPutJsonAssert(args) {
  const {
    currentTestName,
    featureName,
    route,
    body,
    headers: headersObj = {},
    expectedCase,
    options = [],
    config,
    tags = {},
  } = args;

  const headers = options.includes("noContentType")
    ? Object.assign({}, headersObj)
    : Object.assign({ "Content-Type": "application/json" }, headersObj);

  const res = testPutJson(route, body, headers, tags, options);
  const isSuccess = check(
    res,
    getAssertChecks(
      res,
      "PUT",
      body,
      headers,
      `${featureName} | ${currentTestName}`,
      expectedCase,
      config,
    ),
  );
  return {
    isSuccess: isSuccess,
    res: res,
  };
}

/**
 * Sends a DELETE request and asserts the response using object parameters.
 * @param {import("../types/testRequest.d.ts").DeleteTestAssertArgs} args - Arguments for the DELETE request and assertion.
 * @returns {import("../types/testRequest.d.ts").RequestAssertResponse} - Assertion result and k6 http response.
 */
export function testDeleteAssert(args) {
  const {
    currentTestName,
    featureName,
    route,
    params,
    body,
    headers = {},
    expectedCase,
    config,
    tags = {},
  } = args;

  const res = testDelete(route, params, headers, tags);
  const isSuccess = check(
    res,
    getAssertChecks(
      res,
      "DELETE",
      body,
      headers,
      `${featureName} | ${currentTestName}`,
      expectedCase,
      config,
    ),
  );

  return {
    isSuccess: isSuccess,
    res: res,
  };
}
