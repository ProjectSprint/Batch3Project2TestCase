import { isUser } from "../caster/caster.js";
import { isEqual, isExists } from "../helper/assertion.js";
import { generateRandomImageUrl, generateRandomName, generateRandomNumber, generateTestObjects } from "../helper/generator.js";
import { testGetAssert, testPatchJsonAssert } from "../helper/request.js";

/**
 * @param {User} user
 * @param {import("../types/config.d.ts").Config} config
 * @param {{[name: string]: string}} tags
 * @returns {User | undefined}
 */
export function GetProfileTest(user, config, tags) {
  const featureName = "Get Profile";
  const route = config.baseUrl + "/v1/user";
  const assertHandler = testGetAssert;

  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };
  if (config.runNegativeCase) {
    assertHandler(
      "empty token", featureName, route, {}, {},
      {
        ["should return 401"]: (v) => v.status === 401,
      },
      config, tags,
    );
    const negativeHeaders = [
      { Authorization: `${user.token}`, },
      { Authorization: `Bearer asdf${user.token}`, },
      { Authorization: ``, },
    ];

    negativeHeaders.forEach((header) => {
      assertHandler(
        "invalid token", featureName, route, {}, header,
        {
          ["should return 401"]: (res) => res.status === 401,
        },
        config, tags,);
    });
  }

  const res = assertHandler(
    "valid payload", featureName, route, {}, positiveHeader,
    {
      ["should return 200"]: (v) => v.status === 200,
      ["should have email and equal"]: (v) => isEqual(v, "email", user.email),
      ["should have name"]: (v) => isExists(v, "name", ["string", null]),
      ["should have imageUri"]: (v) => isExists(v, "imageUri", ["string", null]),
      ["should have height"]: (v) => isExists(v, "height", ["number", null]),
      ["should have weight"]: (v) => isExists(v, "weight", ["number", null]),
      ["should have heightUnit"]: (v) => isExists(v, "heightUnit", ["string", null]),
      ["should have weightUnit"]: (v) => isExists(v, "weightUnit", ["string", null]),
      ["should have preference"]: (v) => isExists(v, "preference", ["string", null]),
    },
    config, tags,);
  if (res.isSuccess) {
    try {
      const jsonResult = res.res.json();
      if (jsonResult && isUser(jsonResult)) {
        return jsonResult
      }
    } catch (e) {
      console.log(featureName + " | failed to parse json", e)
    }
  }
}

/**
 * @param {User} user
 * @param {import("../types/config.d.ts").Config} config
 * @param {{[name: string]: string}} tags
 * @returns {User | undefined}
 */
export function PatchProfileTest(user, config, tags) {
  const featureName = "Patch Profile";
  const route = config.baseUrl + "/v1/user";
  const assertHandler = testPatchJsonAssert;

  const preferenceEnum = ["CARDIO", "WEIGHT"]
  const weightUnitEnum = ["KG", "LBS"]
  const heightUnitEnum = ["CM", "INCH"]

  const positivePayload = {
    preference: preferenceEnum[generateRandomNumber(0, preferenceEnum.length - 1)],
    heightUnit: heightUnitEnum[generateRandomNumber(0, heightUnitEnum.length - 1)],
    weightUnit: weightUnitEnum[generateRandomNumber(0, weightUnitEnum.length - 1)],
    weight: generateRandomNumber(10, 1000),
    height: generateRandomNumber(3, 250),
    name: generateRandomName(),
    imageUri: generateRandomImageUrl()
  };
  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };
  if (config.runNegativeCase) {
    assertHandler(
      "empty token", featureName, route, {}, {},
      {
        ["should return 401"]: (v) => v.status === 401,
      },
      [], config, tags,);
    const negativeHeaders = [
      { Authorization: `${user.token}`, },
      { Authorization: `Bearer asdf${user.token}`, },
      { Authorization: ``, },
    ];

    negativeHeaders.forEach((header) => {
      assertHandler(
        "invalid token", featureName, route, {}, header,
        {
          ["should return 401"]: (res) => res.status === 401,
        },
        [], config, tags,);
    });
    const negativeTestObjects = generateTestObjects(
      {
        preference: {
          type: "string",
          enum: preferenceEnum,
          notNull: true,
        },
        weightUnit: {
          type: "string",
          enum: weightUnitEnum,
          notNull: true,
        },
        heightUnit: {
          type: "string",
          enum: heightUnitEnum,
          notNull: true,
        },
        weight: {
          type: "number",
          min: 10,
          max: 1000,
          notNull: true,
        },
        height: {
          type: "number",
          min: 3,
          max: 250,
          notNull: true,
        },
        name: {
          type: "string",
          minLength: 2,
          maxLength: 60,
          notNull: true,
        },
        imageUri: {
          type: "string",
          isUrl: true,
          notNull: true,
        },
      },
      positivePayload,
    );
    negativeTestObjects.forEach((payload) => {
      assertHandler(
        "invalid payload", featureName, route, payload, positiveHeader,
        {
          ["should return 400"]: (res) => res.status === 400,
        },
        [], config, tags,);
    });
    assertHandler(
      "invalid content type", featureName, route, positivePayload, positiveHeader,
      {
        ["should return 400"]: (res) => res.status === 400,
      },
      ["noContentType"], config, tags,
    );
  }

  /** @type {import("k6").Checkers<any>} */
  const baseChecks = {
    ["should return 200"]: (v) => v.status === 200,
    ["should have preference and equal"]: (v) => isEqual(v, "preference", positivePayload.preference),
    ["should have weightUnit and equal"]: (v) => isEqual(v, "weightUnit", positivePayload.weightUnit),
    ["should have heightUnit and equal"]: (v) => isEqual(v, "heightUnit", positivePayload.heightUnit),
    ["should have height and equal"]: (v) => isEqual(v, "height", positivePayload.height),
    ["should have weight and equal"]: (v) => isEqual(v, "weight", positivePayload.weight),
    ["should have name and equal"]: (v) => isEqual(v, "name", positivePayload.name),
    ["should have imageUri and equal"]: (v) => isEqual(v, "imageUri", positivePayload.imageUri),
  }
  const res = assertHandler(
    "valid payload", featureName, route, positivePayload, positiveHeader,
    baseChecks,
    [], config, tags,
  );
  if (config.verifyChanges) {
    testGetAssert(
      "valid payload after update", featureName, route, {}, positiveHeader,
      baseChecks,
      config, tags,);
  }

  if (res.isSuccess) {
    try {
      const jsonResult = res.res.json();
      if (jsonResult && isUser(jsonResult)) {
        return jsonResult
      }
    } catch (e) {
      console.log(featureName + " | failed to parse json", e)
    }
  }

  return
}
