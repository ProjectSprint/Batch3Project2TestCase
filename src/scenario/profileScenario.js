import { getProfile } from "../assertion/profileAssertion.js";
import { isUser } from "../assertion/userAssertion.js";
import { isEqualWith, isExists } from "../helper/assertion.js";
import {
  generateRandomImageUrl,
  generateRandomName,
  generateRandomNumber,
  generateTestObjects,
} from "../helper/generator.js";
import { testGetAssert, testPatchJsonAssert } from "../helper/testRequest.js";

/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").Profile | undefined>}
 */
export function GetProfileScenario(config, tags, info) {
  const featureName = "Get Profile";
  const route = config.baseUrl + "/v1/user";
  const assertHandler = testGetAssert;

  const user = info.user;
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  if (config.runNegativeCase) {
    assertHandler({
      featureName: featureName,
      config: config,
      route: route,
      params: {},
      headers: {},
      currentTestName: "unauthorized",
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
      tags: {},
    });
  }

  // --- Positive Case ---
  const positiveResult = assertHandler({
    featureName: featureName,
    config: config,
    route: route,
    params: {},
    headers: { Authorization: user.token },
    currentTestName: "success get profile",
    expectedCase: {
      ["should return 200"]: (_parsed, res) => res.status === 200,
      ["email should be string"]: (parsed, _res) =>
        isEqualWith(parsed, "email", (val) => {
          if (typeof val[0] === "string") {
            if (val[0].length === 0) return true;

            const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return regex.test(val[0]);
          }
          return false;
        }),
      ["preference should be string"]: (parsed, _res) =>
        isExists(parsed, "preference", ["null"]),
      ["weightUnit should be string"]: (parsed, _res) =>
        isExists(parsed, "weightUnit", ["null"]),
      ["heightUnit should be string"]: (parsed, _res) =>
        isExists(parsed, "heightUnit", ["null"]),
      ["weight should be numerical"]: (parsed, _res) =>
        isExists(parsed, "weight", ["null"]),
      ["height should be string"]: (parsed, _res) =>
        isExists(parsed, "height", ["null"]),
      ["imageUri should be string"]: (parsed, _res) =>
        isExists(parsed, "imageUri", ["null"]),
      ["name should be string"]: (parsed, _res) =>
        isExists(parsed, "name", ["string"]),
    },
    tags: {},
  });

  if (positiveResult.isSuccess) {
    return getProfile(positiveResult.res, {}, featureName);
  } else {
    console.warn(`${featureName} | Skipping due to failed assertions.`);
    return undefined;
  }
}
/**
 * @type {string[]}
 */
let preferencesEnum = ["CARDIO", "WEIGHT"];
/**
 * @type {string[]}
 */
let weightEnum = ["KG", "LB"];
/**
 * @type {string[]}
 */
let heightEnum = ["CM", "INCH"];

/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").Profile | undefined>}
 */
export function PatchProfileScenario(config, tags, info) {
  const featureName = "Patch Profile";
  const route = config.baseUrl + "/v1/user";
  const assertHandler = testPatchJsonAssert;
  const getHandler = testGetAssert;

  const user = info.user;
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  const positivePayload = {
    preference:
      preferencesEnum[Math.floor(Math.random() * preferencesEnum.length)],
    weightUnit: weightEnum[Math.floor(Math.random() * weightEnum.length)],
    heightUnit: heightEnum[Math.floor(Math.random() * heightEnum.length)],
    weight: generateRandomNumber(11, 999),
    height: generateRandomNumber(4, 249),
    name: generateRandomName(),
    imageUri: generateRandomImageUrl(),
  };

  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "no token",
      featureName: featureName,
      route: route,
      body: {},
      headers: {},
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
      options: [],
      config: config,
      tags: {},
    });
    assertHandler({
      currentTestName: "empty body",
      featureName: featureName,
      route: route,
      body: {},
      headers: { Authorization: user.token },
      expectedCase: {
        ["should return 400"]: (_parsed, res) => res.status === 400,
      },
      options: [],
      config: config,
      tags: {},
    });

    const testObjects = generateTestObjects(
      {
        preference: {
          type: "string",
          enum: preferencesEnum,
          notNull: false,
        },
        weightUnit: {
          type: "string",
          enum: weightEnum,
          notNull: false,
        },
        heightUnit: {
          type: "string",
          enum: heightEnum,
          notNull: false,
        },
        weight: {
          type: "number",
          notNull: true,
          min: 10,
          max: 1000,
        },
        height: {
          type: "number",
          notNull: true,
          min: 3,
          maxLength: 250,
        },
        name: {
          type: "string",
          notNull: false,
          minLength: 2,
          maxLength: 60,
        },
        imageUri: {
          type: "string",
          notNull: false,
          isUrl: true,
        },
      },
      positivePayload,
    );
    testObjects.forEach((payload) => {
      assertHandler({
        currentTestName: "invalid payload",
        featureName: featureName,
        route: route,
        body: payload,
        headers: { Authorization: user.token },
        expectedCase: {
          ["should return 400"]: (_parsed, res) => res.status === 400,
        },
        options: [],
        config: config,
        tags: {},
      });
    });
  }

  // --- Positive Case ---
  const positiveResult = assertHandler({
    currentTestName: "valid payload",
    featureName: featureName,
    route: route,
    body: positivePayload,
    headers: { Authorization: user.token },
    expectedCase: {
      ["should return 200"]: (_parsed, res) => res.status === 200,
      ["preference should be string"]: (parsed, _res) =>
        isExists(parsed, "preference", ["string"]),
      ["weightUnit should be string"]: (parsed, _res) =>
        isExists(parsed, "weightUnit", ["string"]),
      ["heightUnit should be string"]: (parsed, _res) =>
        isExists(parsed, "heightUnit", ["string"]),
      ["weight should be image"]: (parsed, _res) =>
        isExists(parsed, "weight", ["number"]),
      ["height should be number"]: (parsed, _res) =>
        isExists(parsed, "height", ["number"]),
      ["name should be string"]: (parsed, _res) =>
        isExists(parsed, "name", ["string"]),
      ["imageUri should be string"]: (parsed, _res) =>
        isExists(parsed, "imageUri", ["string"]),
    },
    options: [],
    config: config,
    tags: {},
  });

  // todo: get back the user after updating and make sure that the value is no longer null
  if (positiveResult.isSuccess) {
    return getProfile(positiveResult.res, {}, featureName);
  } else {
    console.warn(
      `${featureName} | Skipping getProfile due to failed assertions.`,
    );
    return undefined;
  }
}
