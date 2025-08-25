/**
 * Asserts the response of a k6 request. Parses JSON once.
 * @param {import("k6/http").RefinedResponse<import("k6/http").ResponseType>} k6response The k6 HTTP response.
 * @param {string} httpMethod The HTTP method used (e.g., "GET", "POST").
 * @param {import("k6").JSONValue | import("../types/k6-http.d.ts").StructuredRequestBody | string} requestPayload The payload sent (or params string). Adjust path if needed.
 * @param {{[name: string]: string}} requestHeader The headers sent.
 * @param {string} featureName The name of the feature/scenario part.
 * @param {import("src/types/assertion.js").Checkers} conditions The checks to perform. Adjust path if needed.
 * @param {import("src/types/config.js").Config} config The configuration object. Adjust path if needed.
 * @returns {Record<string, import("k6").Checker<import("k6/http").RefinedResponse<import("k6/http").ResponseType>>>} Checkes that can be inputted in k6 check()
 */
export function getAssertChecks(
  k6response,
  httpMethod,
  requestPayload,
  requestHeader,
  featureName,
  conditions,
  config,
) {
  /** @type {import("k6").JSONValue} */
  let parsedJson = null;
  /** @type {string | null} */
  let parseError = null;

  try {
    if (
      k6response.body &&
      typeof k6response.body === "string" &&
      k6response.body.length > 0
    ) {
      parsedJson = k6response.json();
    } else if (k6response.body && typeof k6response.body !== "string") {
      if (config.debug)
        console.log(
          `${featureName} | Response body is not a string, skipping JSON parsing.`,
        );
    }
  } catch (e) {
    parseError = e instanceof Error ? e.message : String(e);
    if (config.debug) {
      console.warn(`${featureName} | JSON parsing failed: ${parseError}`);
    }
  }

  /** @type Record<string, import("k6").Checker<import("k6/http").RefinedResponse<import("k6/http").ResponseType>>> **/
  const checks = {};

  Object.keys(conditions).forEach((testMsg) => {
    const userConditionFn = conditions[testMsg];
    const testName = `${featureName} | ${testMsg}`;

    checks[testName] = () => {
      try {
        const result = userConditionFn(parsedJson, k6response);

        if (config.debug) {
          console.log(`${testName} | assert result: ${result}`);
          if (!result && parseError) {
            console.log(
              `${testName} | Note: JSON parsing may have failed earlier (${parseError})`,
            );
          }
        }

        return result;
      } catch (checkError) {
        if (config.debug) {
          console.error(
            `${testName} | Error during check execution: ${checkError}`,
          );
        }
        return false;
      }
    };
  });

  if (config.debug) {
    console.log(
      `${featureName} | request path: ${httpMethod} ${k6response.url}`,
    );
    console.log(
      `${featureName} | request header: ${JSON.stringify(requestHeader)}`,
    );
    console.log(
      `${featureName} | request payload: ${typeof requestPayload === "object" ? JSON.stringify(requestPayload) : requestPayload}`,
    );
    console.log(`${featureName} | response code: ${k6response.status}`);
    console.log(`${featureName} | response body (raw): ${k6response.body}`);
    if (parseError) {
      console.log(
        `${featureName} | response body (parsed): ERROR - ${parseError}`,
      );
    } else if (parsedJson !== null) {
      console.log(
        `${featureName} | response body (parsed): successfully parsed`,
      );
    } else {
      console.log(
        `${featureName} | response body (parsed): No body or body not JSON`,
      );
    }
  }

  return checks;
}

/**
 * Checks whether the parsed JSON contains items where every item is different from every item in the comparator JSON based on a query.
 * @param {import("k6").JSONValue} parsedJsonV - Parsed JSON of the first response.
 * @param {import("k6").JSONValue} parsedJsonVc - Parsed JSON of the second (comparator) response.
 * @param {string} query - The query path to extract items for comparison.
 * @returns {boolean} - True if every item in V is different from every item in Vc, false otherwise or on error/null input.
 */
export function isEveryItemDifferent(parsedJsonV, parsedJsonVc, query) {
  if (parsedJsonV === null || parsedJsonVc === null) return false;
  try {
    const res = traverseObject(parsedJsonV, query);
    const resComparator = traverseObject(parsedJsonVc, query);
    if (res.length === 0 || resComparator.length === 0) return false;

    return res.every((item) => {
      if (Array.isArray(item) || (typeof item === "object" && item !== null))
        return false;
      return resComparator.every((comparatorItem) => {
        if (
          Array.isArray(comparatorItem) ||
          (typeof comparatorItem === "object" && comparatorItem !== null)
        )
          return false;
        if (item === null || comparatorItem === null) return false;
        if (typeof item !== typeof comparatorItem) return false;
        return item !== comparatorItem;
      });
    });
  } catch (e) {
    return false;
  }
}

/**
 * Checks whether every item found via query in parsed JSON contains a specific search string (case-insensitive).
 * @param {import("k6").JSONValue} parsedJson - The pre-parsed JSON object.
 * @param {string} query - The query path to extract items.
 * @param {string} searchStr - The substring to search for.
 * @returns {boolean} - True if all found string items contain searchStr, false otherwise or on error/null input.
 */
export function isEveryItemContain(parsedJson, query, searchStr) {
  if (parsedJson === null) return false;
  try {
    const res = traverseObject(parsedJson, query);
    if (res.length === 0) return false;
    return res.every((item) => {
      if (typeof item !== "string") return false;
      return item.toLowerCase().includes(searchStr.toLowerCase());
    });
  } catch (e) {
    return false;
  }
}

/**
 * Checks whether the parsed JSON has the data that the query asks and matches any of the expected types.
 * @param {import("k6").JSONValue} parsedJson - The pre-parsed JSON object.
 * @param {string} query - The query path to extract values.
 * @param {Array<'string'|'number'|'object'|'boolean'|'array'|null>} expectedTypes - Allowed types ('array' added for clarity).
 * @returns {boolean} - True if all found values match one of the expected types, false otherwise or on error/null input.
 */
export function isExists(parsedJson, query, expectedTypes) {
  if (parsedJson === null && !expectedTypes.includes(null)) return false;
  if (parsedJson === null && expectedTypes.includes(null)) {
    try {
      return traverseObject(null, query).every((v) => v === null);
    } catch (e) {
      return false;
    }
  }
  try {
    const res = traverseObject(
      /** @type {import("k6").JSONValue} */ (parsedJson),
      query,
    );
    if (res.length === 0) return expectedTypes.includes(null);

    return res.every((value) => {
      const valueType = typeof value;
      if (value === null) return expectedTypes.includes(null);
      if (Array.isArray(value))
        return (
          expectedTypes.includes("array") || expectedTypes.includes("object")
        );
      if (valueType === "object") return expectedTypes.includes("object");
      if (valueType === "string") return expectedTypes.includes("string");
      if (valueType === "number") return expectedTypes.includes("number");
      if (valueType === "boolean") return expectedTypes.includes("boolean");
      return false;
    });
  } catch (e) {
    return false;
  }
}

/**
 * validate ISO date string
 * @param {string} dateString
 * @returns {boolean}
 */
export function isValidDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Helper function to check if a string is a valid URL.
 * @param {string} url - The URL to check.
 * @returns {boolean} - Returns true if the URL is valid, otherwise false.
 */
export function isValidUrl(url) {
  return (
    typeof url === "string" &&
    (url.startsWith("http://") || url.startsWith("https://"))
  );
}

/**
 * @callback EqualWithCallback
 * @param {Array<import("k6").JSONValue>} arr - The array of values extracted by the query.
 * @returns {boolean} - The result of the custom comparison.
 */

/**
 * Checks if the result of traversing the parsed JSON matches a custom condition via callback.
 * @param {import("k6").JSONValue} parsedJson - The pre-parsed JSON object.
 * @param {string} query - The query used to traverse the object.
 * @param {EqualWithCallback} cb - The callback function.
 * @returns {boolean} - Returns the result of the callback, or false on error/null input.
 */
export function isEqualWith(parsedJson, query, cb) {
  if (parsedJson === null) return cb([]);
  try {
    return cb(traverseObject(parsedJson, query));
  } catch (e) {
    return false;
  }
}

/**
 * Checks whether parsed JSON has the data that the query asks and includes the expected value.
 * @param {import("k6").JSONValue} parsedJson - The pre-parsed JSON object.
 * @param {string} query - The query path to extract values.
 * @param {unknown} expected - The value expected to be included in the results.
 * @returns {boolean} - True if the expected value is found, false otherwise or on error/null input.
 */
export function isEqual(parsedJson, query, expected) {
  if (parsedJson === null) return expected === null;
  try {
    const res = traverseObject(parsedJson, query);
    return res.includes(/** @type {any} */ (expected)); // Cast needed for includes with unknown
  } catch (e) {
    return false;
  }
}

/**
 * @callback ConversionCallback
 * @param {import("k6").JSONValue} item - The item extracted by the query.
 * @returns {unknown} - The value to be used for ordering comparison (e.g., number, string).
 */

/**
 * Checks if the values extracted from parsed JSON by a query are ordered after an optional conversion.
 * Ensures values are comparable (numbers or strings) before comparison.
 * @param {import("k6").JSONValue} parsedJson - The pre-parsed JSON object.
 * @param {string} query - The query path to extract values.
 * @param {"asc"|"desc"} ordered - The expected order ('asc' or 'desc').
 * @param {ConversionCallback} [conversion] - Optional function to convert items before comparison. Defaults to identity.
 * @returns {boolean} - Returns true if the values are comparably typed and ordered as specified, false otherwise or on error/null input.
 */
export function isOrdered(parsedJson, query, ordered, conversion) {
  if (parsedJson === null) return true; // Treat as empty, which is ordered
  try {
    const conversionFn = conversion || ((v) => v);
    const res = traverseObject(parsedJson, query).map(conversionFn);

    if (res.length < 2) {
      return true; // Arrays with 0 or 1 element are considered ordered
    }

    for (let i = 1; i < res.length; i++) {
      const prev = res[i - 1];
      const curr = res[i];

      // Ensure both values are of the same comparable type (number or string)
      if (
        typeof prev !== typeof curr ||
        (typeof prev !== "number" && typeof prev !== "string") ||
        (typeof curr !== "number" && typeof curr !== "string")
      ) {
        // If types mismatch or are not comparable (object, boolean, null, undefined), the sequence isn't validly ordered by < or >
        console.warn(
          `isOrdered: Incomparable types found at index ${i - 1} (${typeof prev}) and ${i} (${typeof curr}) for query "${query}".`,
        );
        return false;
      }

      if (ordered === "asc" && curr < prev) return false;
      if (ordered === "desc" && curr > prev) return false;
    }
    // If the loop completes without returning false, it's ordered.
    return true;
  } catch (e) {
    console.error(
      `isOrdered: Error during processing for query "${query}": ${e}`,
    );
    return false;
  }
}

/**
 * Checks if the total number of items found via query in parsed JSON is within a specified range.
 * @param {import("k6").JSONValue} parsedJson - The pre-parsed JSON object.
 * @param {string} query - The query path to extract items.
 * @param {number} min - The minimum number of items allowed (inclusive).
 * @param {number} max - The maximum number of items allowed (inclusive).
 * @returns {boolean} - Returns true if the count is within range, false otherwise or on error/null input.
 */
export function isTotalDataInRange(parsedJson, query, min, max) {
  if (parsedJson === null) return 0 >= min && 0 <= max;
  try {
    const res = traverseObject(parsedJson, query);
    return res.length >= min && res.length <= max;
  } catch (e) {
    return false;
  }
}

/**
 * @callback MapCallback
 * @param {import("k6").JSONValue} item - The current item being processed
 * @returns {Array<import("k6").JSONValue>} The transformed items
 */

/**
 * flat the map (custom implementation as Array.flatMap might not be supported)
 * @param {Array<import("k6").JSONValue>} arr - The array to traverse
 * @param {MapCallback} callback - The callback function to transform items
 * @returns {Array<import("k6").JSONValue>}
 */
function flatMap(arr, callback) {
  /** @type {Array<import("k6").JSONValue>} */
  const result = [];
  if (!Array.isArray(arr)) {
    return result;
  }
  for (const item of arr) {
    const callbackResult = callback(item);
    if (Array.isArray(callbackResult)) {
      for (const value of callbackResult) {
        result.push(value);
      }
    }
  }
  return result;
}

/**
 * Traverses an object or array and retrieves values based on a dot-notation query.
 * Supports array traversal with "[]" notation (e.g., "items[].id", "[].value").
 * Returns an array of found values. Handles null/undefined gracefully during traversal.
 *
 * @param {import("k6").JSONValue | undefined} obj - The object or array to traverse.
 * @param {string} query - The query string (e.g., "data.user.name", "results[].id").
 * @returns {Array<import("k6").JSONValue>} - An array of values found at the query path. Returns empty array if path doesn't exist or input is null/undefined.
 */
export function traverseObject(obj, query) {
  // NOTE: Implementation of traverseObject remains the same as the previous version.
  // It should already handle null/undefined inputs and non-object traversal steps gracefully.
  if (obj === null || obj === undefined) {
    return [];
  }
  if (query.startsWith("[]")) {
    if (!Array.isArray(obj)) return [];
    const remainingQuery = query.slice(2);
    if (!remainingQuery) return obj.map((item) => item);
    const cleanQuery = remainingQuery.startsWith(".")
      ? remainingQuery.slice(1)
      : remainingQuery;
    if (!cleanQuery) return obj.map((item) => item);
    return flatMap(obj, (item) => traverseObject(item, cleanQuery));
  }
  const keys = query.split(".");
  /** @type {Array<import("k6").JSONValue | undefined>} */
  let currentLevelValues = [obj];
  for (const key of keys) {
    if (currentLevelValues.length === 0) return [];
    /** @type {Array<import("k6").JSONValue | undefined>} */
    const nextLevelValues = [];
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      currentLevelValues.forEach((currentItem) => {
        let targetArray = null;
        if (currentItem && typeof currentItem === "object") {
          if (arrayKey === "" && Array.isArray(currentItem))
            targetArray = currentItem;
          else if (arrayKey !== "" && !Array.isArray(currentItem))
            targetArray = /** @type {import("k6").JSONObject} */ (currentItem)[
              arrayKey
            ]; // Cast needed
        }
        if (Array.isArray(targetArray))
          targetArray.forEach((item) => nextLevelValues.push(item));
      });
    } else {
      currentLevelValues.forEach((currentItem) => {
        if (
          currentItem &&
          typeof currentItem === "object" &&
          !Array.isArray(currentItem)
        ) {
          nextLevelValues.push(
            /** @type {import("k6").JSONObject} */ (currentItem)[key],
          ); // Cast needed
        } else {
          nextLevelValues.push(undefined);
        }
      });
    }
    currentLevelValues = nextLevelValues;
  }
  return /** @type {Array<import("k6").JSONValue>} */ (
    currentLevelValues.filter((v) => v !== undefined)
  );
}
