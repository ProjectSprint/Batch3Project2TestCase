/** @type {number} */
export const MaxInt = 9007199254740991; // Maximum safe integer in JavaScript

/**
 * @returns {string}
 */
export function generateRandomImageUrl() {
  return `http://${generateRandomDomain()}/image.jpg`;
}

/**
 * @param {boolean} addPlusPrefix
 * @returns {string}
 */
export function generateRandomPhoneNumber(addPlusPrefix) {
  /** @type {readonly string[]} */
  const callingCodes = [
    "1",
    "44",
    "49",
    "61",
    "81",
    "86",
    "93",
    "355",
    "213",
    "376",
    "244",
    "54",
    "374",
    "297",
    "61",
    "43",
    "994",
    "973",
    "880",
    "375",
    "32",
    "501",
    "229",
    "975",
    "591",
    "387",
    "267",
    "55",
    "673",
    "359",
    "226",
    "257",
    "855",
    "237",
    "238",
    "236",
    "235",
    "56",
    "86",
    "57",
    "269",
    "242",
    "243",
    "682",
    "506",
    "385",
    "53",
    "357",
    "420",
    "45",
    "253",
    "670",
    "593",
    "20",
    "503",
    "240",
    "291",
    "372",
    "251",
    "500",
    "298",
    "679",
    "358",
    "33",
    "689",
    "241",
    "220",
    "995",
    "49",
    "233",
    "350",
    "30",
    "299",
    "502",
    "224",
    "245",
    "592",
    "509",
    "504",
    "852",
    "36",
    "354",
    "91",
    "62",
    "98",
    "964",
    "353",
    "972",
    "39",
    "225",
    "81",
    "962",
    "7",
    "254",
    "686",
    "965",
    "996",
    "856",
    "371",
    "961",
    "266",
    "231",
    "218",
    "423",
    "370",
    "352",
    "853",
    "389",
    "261",
    "265",
    "60",
    "960",
    "223",
    "356",
    "692",
    "222",
    "230",
    "262",
    "52",
    "691",
    "373",
    "377",
    "976",
    "382",
    "212",
    "258",
    "95",
    "264",
    "674",
    "977",
    "31",
    "687",
    "64",
    "505",
    "227",
    "234",
    "683",
    "850",
    "47",
    "968",
    "92",
    "680",
    "507",
    "675",
    "595",
    "51",
    "63",
    "48",
    "351",
    "974",
    "40",
    "7",
    "250",
    "590",
    "685",
    "378",
    "239",
    "966",
    "221",
    "381",
    "248",
    "232",
    "65",
    "421",
    "386",
    "677",
    "252",
    "27",
    "82",
    "34",
    "94",
    "249",
    "597",
    "268",
    "46",
    "41",
    "963",
    "886",
    "992",
    "255",
    "66",
    "228",
    "690",
    "676",
    "216",
    "90",
    "993",
    "688",
    "256",
    "380",
    "971",
    "44",
    "598",
    "998",
    "678",
    "58",
    "84",
    "681",
    "967",
    "260",
    "263",
  ];

  const callingCode =
    callingCodes[Math.floor(Math.random() * callingCodes.length)];
  const phoneNumber = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(8, "0");

  return addPlusPrefix
    ? "+" + callingCode + phoneNumber
    : callingCode + phoneNumber;
}

/**
 * @returns {string}
 */
function generateRandomDomain() {
  const domain = generateRandomName().replace(/\s/g, "").toLowerCase();
  /** @type {readonly string[]} */
  const tlds = ["com", "net", "org", "io", "co", "xyz"];
  const tld = tlds[Math.floor(Math.random() * tlds.length)];
  return `${domain}.${tld}`;
}

/**
 * @returns {string}
 */
export function generateRandomEmail() {
  const username = generateRandomUsername();
  const domain = generateRandomDomain();
  return `${username}@${domain}`;
}

/**
 * @returns {string}
 * @param {number} minLength
 * @param {number} maxLength
 */
export function generateRandomPassword(minLength = 5, maxLength = 15) {
  // Ensure minLength is not greater than maxLength
  if (minLength > maxLength) {
    [minLength, maxLength] = [maxLength, minLength];
  }

  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }

  return password;
}
/**
 * Generates a random word using alphabetical characters
 * @param {number} minLength - Minimum length of the generated word (inclusive)
 * @param {number} maxLength - Maximum length of the generated word (inclusive)
 * @returns {string} Random word with length between minLength and maxLength
 * @throws {Error} If minLength is greater than maxLength or if either parameter is less than 1
 */
export function generateRandomWord(minLength, maxLength) {
  // Input validation
  if (minLength > maxLength) {
    throw new Error("minLength cannot be greater than maxLength");
  }
  if (minLength < 1 || maxLength < 1) {
    throw new Error("Length parameters must be greater than 0");
  }

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  // Generate random length between min and max
  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  // Generate the word
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

// Example usage:
// console.log(generateRandomWord(3, 6));  // Could output: "Hello"
// console.log(generateRandomWord(5, 5));  // Fixed length of 5
// console.log(generateRandomWord(1, 10)); // Random length between 1 and 10
/**
 * @returns {string}
 */
export function generateRandomUsername() {
  // @type {readonly string[]} */
  const prefixes = [
    "An",
    "Ben",
    "Jon",
    "Xen",
    "Lor",
    "Mar",
    "Fel",
    "Cal",
    "Nor",
    "Zan",
    "Vin",
    "Hal",
    "Eli",
    "Oli",
    "Ray",
    "Sam",
    "Tim",
    "Ken",
    "Leo",
    "Kai",
  ];

  /** @type {readonly string[]} */
  const middles = [
    "dra",
    "vi",
    "na",
    "lo",
    "ki",
    "ra",
    "li",
    "no",
    "mi",
    "ta",
    "ne",
    "ro",
    "sa",
    "mo",
    "ze",
    "fa",
    "de",
    "pe",
    "su",
    "re",
  ];

  /** @type {readonly string[]}*/
  const suffixes = [
    "son",
    "ton",
    "ly",
    "en",
    "er",
    "man",
    "den",
    "ren",
    "vin",
    "sen",
    "ler",
    "ter",
    "mon",
    "lin",
    "ker",
    "nor",
    "len",
    "tan",
    "ver",
    "mer",
  ];

  let username = "";
  while (username.length < 5 || username.length > 15) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = middles[Math.floor(Math.random() * middles.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    username = prefix + middle + suffix + Math.floor(Math.random() * 10000);
  }

  return username;
}

/**
 * @param {string | number | Date} from
 * @param {string | number | Date} to
 * @returns {string}
 */
export function generateRandomDate(from, to) {
  const fromDate = new Date(from).getTime();
  const toDate = new Date(to).getTime();
  const randomDate = new Date(fromDate + Math.random() * (toDate - fromDate));
  return randomDate.toISOString();
}

/**
 * @returns {string}
 */
export function generateRandomName() {
  // @type {readonly string[]} */
  const prefixes = [
    "An",
    "Ben",
    "Jon",
    "Xen",
    "Lor",
    "Mar",
    "Fel",
    "Cal",
    "Nor",
    "Zan",
    "Vin",
    "Hal",
    "Eli",
    "Oli",
    "Ray",
    "Sam",
    "Tim",
    "Ken",
    "Leo",
    "Kai",
  ];

  /** @type {readonly string[]} */
  const middles = [
    "dra",
    "vi",
    "na",
    "lo",
    "ki",
    "ra",
    "li",
    "no",
    "mi",
    "ta",
    "ne",
    "ro",
    "sa",
    "mo",
    "ze",
    "fa",
    "de",
    "pe",
    "su",
    "re",
  ];

  /** @type {readonly string[]}*/
  const suffixes = [
    "son",
    "ton",
    "ly",
    "en",
    "er",
    "man",
    "den",
    "ren",
    "vin",
    "sen",
    "ler",
    "ter",
    "mon",
    "lin",
    "ker",
    "nor",
    "len",
    "tan",
    "ver",
    "mer",
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const middle = middles[Math.floor(Math.random() * middles.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${middle} ${suffix}`;
}

/**
 * @param {number} [maxLength=20]
 * @returns {string}
 */
export function generateRandomDescription(maxLength = 20) {
  const loremIpsum = "Lorem ipsum dolor sit amet..."; // shortened for brevity
  return loremIpsum.length <= maxLength
    ? loremIpsum
    : loremIpsum.substring(0, maxLength);
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * @param {import('../types/generator.d.ts').GenerateUrlParamFromObjSchema} params
 * @returns {string}
 */
export function generateUrlParamFromObj(params) {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
}

/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * @template {object} T
 * @param {T} obj - The base object
 * @param {Partial<T>} objTruth - The object with properties to merge
 * @returns {T}
 */
export function combine(obj, objTruth) {
  return /** @type {T} */ (Object.assign({}, clone(obj), objTruth));
}

/**
 * @param {number} percentage
 * @returns {boolean}
 */
export function generateBoolFromPercentage(percentage) {
  return Math.random() <= percentage;
}

/**
 * @param {import('../types/generator.d.ts').GenerateTestObjectSchema} schema
 * @param {import("k6").JSONValue} validTemplate
 * @returns {import("k6").JSONValue[]}
 */
export function generateTestObjects(schema, validTemplate) {
  // Validate input
  if (
    validTemplate === null ||
    typeof validTemplate !== "object" ||
    Array.isArray(validTemplate)
  ) {
    throw new Error("validTemplate must be an object");
  }

  /** @type {import("k6").JSONValue[]} */
  const violations = [];

  /**
   * @param {string} path
   * @param {import("k6").JSONValue} violation
   */
  function addViolation(path, violation) {
    const testCase = clone(validTemplate);

    // Validate cloned template
    if (
      testCase === null ||
      typeof testCase !== "object" ||
      Array.isArray(testCase)
    ) {
      throw new Error("Invalid testCase after cloning");
    }

    const parts = path.split(".");
    /** @type {Record<string, unknown>} */
    let current = testCase;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

      if (arrayMatch) {
        const [, arrayName, indexStr] = arrayMatch;
        const index = parseInt(indexStr, 10);

        const arr = current[arrayName];
        if (!Array.isArray(arr)) {
          throw new Error(`${arrayName} is not an array`);
        }

        const nextObj = arr[index];
        if (
          nextObj === null ||
          typeof nextObj !== "object" ||
          Array.isArray(nextObj)
        ) {
          throw new Error(`Invalid nested object at ${arrayName}[${index}]`);
        }

        current = /** @type {Record<string, unknown>} */ (nextObj);
      } else {
        const next = current[part];
        if (next === null || typeof next !== "object" || Array.isArray(next)) {
          throw new Error(`Invalid nested object at ${part}`);
        }

        current = /** @type {Record<string, unknown>} */ (next);
      }
    }
    const lastPart = parts[parts.length - 1];
    const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);

    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);

      if (!(arrayName in current)) {
        throw new Error(`Invalid path: ${arrayName} not found`);
      }

      const arr = current[arrayName];
      if (!Array.isArray(arr)) {
        throw new Error(`${arrayName} is not an array`);
      }

      arr[index] = violation;
    } else {
      current[lastPart] = violation;
    }

    violations.push(testCase);
  }

  /**
   * @param {string} propPath
   * @param {string} type
   */
  function generateDataTypeViolations(propPath, type) {
    /** @type {Record<string, import("k6").JSONValue[]>} */
    const dataTypes = {
      string: ["", 123, true, {}, []],
      "string-param": [123, true, {}, []],
      number: ["notANumber", true, {}, []],
      boolean: ["notABoolean", 123, {}, []],
      object: ["notAnObject", 123, true, []],
      array: ["notAnArray", 123, true, {}],
    };

    if (type in dataTypes) {
      dataTypes[type].forEach((violation) => {
        addViolation(propPath, violation);
      });
    }
  }

  /**
   * Generates test objects based on a given schema and a valid template.
   * The function creates a list of violations, which are test cases that violate the rules defined in the schema.
   * @param {string} propPath
   * @param {import('../types/generator.d.ts').TestObjectSchema} propRules
   * @param {unknown} parentValue
   */
  function generateViolationsForProp(propPath, propRules, parentValue) {
    if (!parentValue) parentValue = {};

    if (propRules.notNull) {
      addViolation(propPath, null);
    }

    if (propRules.isUrl) {
      addViolation(propPath, "notAUrl");
      addViolation(propPath, "http://incomplete");
    }

    if (propRules.isEmail) {
      addViolation(propPath, "notAnEmail");
      addViolation(propPath, "missingdomain.com");
    }

    if (propRules.isPhoneNumber) {
      addViolation(propPath, "notAPhoneNumber");
      addViolation(propPath, "1234567890");
    }

    if (propRules.addPlusPrefixPhoneNumber) {
      addViolation(propPath, "1234567890");
    }

    if (propRules.type) {
      generateDataTypeViolations(propPath, propRules.type);

      switch (propRules.type) {
        case "string":
        case "string-param":
          if (typeof propRules.minLength === "number") {
            addViolation(propPath, "a".repeat(propRules.minLength - 1));
          }
          if (typeof propRules.maxLength === "number") {
            addViolation(propPath, "a".repeat(propRules.maxLength + 1));
          }
          if (Array.isArray(propRules.enum)) {
            addViolation(propPath, "notAnEnumValue");
          }
          break;

        case "number":
          if (typeof propRules.min === "number") {
            addViolation(propPath, propRules.min - 1);
          }
          if (typeof propRules.max === "number") {
            addViolation(propPath, propRules.max + 1);
          }
          break;

        case "array":
          if (propRules.items) {
            if (propRules.items.notNull) {
              addViolation(`${propPath}[0]`, null);
            }
            if (
              propRules.items.type === "object" &&
              propRules.items.properties
            ) {
              Object.entries(propRules.items.properties).forEach(
                ([nestedProp, nestedRules]) => {
                  const parentArr = /** @type {Record<string, unknown>[]} */ (
                    parentValue
                  );
                  generateViolationsForProp(
                    `${propPath}[0].${nestedProp}`,
                    nestedRules,
                    parentArr?.[0]?.[nestedProp],
                  );
                },
              );
            }
          }
          break;

        case "object":
          if (propRules.properties) {
            Object.entries(propRules.properties).forEach(
              ([nestedProp, nestedRules]) => {
                const parentObj = /** @type {Record<string, unknown>} */ (
                  parentValue
                );
                generateViolationsForProp(
                  `${propPath}.${nestedProp}`,
                  nestedRules,
                  parentObj[nestedProp],
                );
              },
            );
          }
          break;
      }
    }
  }

  Object.entries(schema).forEach(([prop, propRules]) => {
    const validTemplateObj = /** @type {Record<string, unknown>} */ (
      validTemplate
    );
    generateViolationsForProp(prop, propRules, validTemplateObj[prop]);
  });

  return violations;
}
/**
 * @param {number} probability
 * @param {Function} fn
 * */
export function withProbability(probability, fn) {
  // Ensure probability is between 0 and 1
  if (probability < 0 || probability > 1) {
    throw new Error("Probability must be between 0 and 1");
  }

  // Generate random number between 0 and 1
  const random = Math.random();

  // Execute function if random number is less than probability
  if (random < probability) {
    return fn();
  }
}
