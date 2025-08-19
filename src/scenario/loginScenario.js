import { getUser, isUser } from "../assertion/userAssertion.js";
import { isEqual, isExists } from "../helper/assertion.js";
import {
  combine,
  generateRandomEmail,
  generateRandomPassword,
  generateTestObjects,
} from "../helper/generator.js";
import { testPostJsonAssert } from "../helper/testRequest.js";

/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").User | undefined>}
 */
export function LoginScenario(config, tags, info) {
  const featureName = "Login";
  const route = config.baseUrl + "/v1/login";
  const assertHandler = testPostJsonAssert;

  // validasi user
  const user = info.user;
  console.log("user: ", user);
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  const positivePayload = {
    email: registeredUserEmail[0].email,
    password: registeredUserEmail[0].password,
  };
  
  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "empty body",
      featureName: featureName,
      route: route,
      body: {},
      headers: {},
      expectedCase: {
        // Use underscore '_' prefix for unused 'parsed' parameter
        ["should return 400"]: (_parsed, res) => res.status === 400,
      },
      options: [],
      config: config,
      tags: tags,
    });

    const testObjects = generateTestObjects(
      {
        email: {
          type: "string",
          notNull: true,
          isEmail: true,
        },
        password: {
          type: "string",
          notNull: true,
          minLength: 8,
          maxLength: 32,
        },
      },
      positivePayload,
    );

    // test: invalid payload, email not exist
    testObjects.forEach((payload) => {
      assertHandler({
        currentTestName: "invalid payload",
        featureName: featureName,
        route: route,
        body: payload,
        headers: {},
        expectedCase: {
          ["should return 400"]: (_parsed, res) => res.status === 400,
        },
        options: [],
        config: config,
        tags: tags,
      });
    });
  }

  // --- Positive Case ---
  const registerResult = assertHandler({
    currentTestName: "valid payload",
    featureName: featureName,
    route: route,
    body: positivePayload,
    headers: {},
    expectedCase: {
      ["should return 200"]: (_parsed, res) => res.status === 200,
      ["should have email"]: (parsed, _res) =>
        isExists(parsed, "email", ["string"]),
      ["should have token"]: (parsed, _res) =>
        isExists(parsed, "token", ["string"]),
    },
    options: [],
    config: config,
    tags: tags,
  });

  // --- Return User ---
  if (registerResult.isSuccess) {
    return getUser(registerResult.res, positivePayload, featureName);
  } else {
    console.warn(
      `${featureName} | Skipping getUser due to failed registration assertions.`,
    );
    return undefined;
  }
}

/**
 * @type {import("src/entity/app.js").User[]}
 */
let registeredUserEmail = [{email: "mas@gmail.com", password: "password", token: ""}];

/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").User | undefined>}
 */
export function RegisterScenario(config, tags, info) {
  const featureName = "Register Email";
  const route = config.baseUrl + "/v1/register";
  const assertHandler = testPostJsonAssert;

  const positivePayload = {
    email: generateRandomEmail(),
    password: generateRandomPassword(8, 32),
  };

  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "empty body",
      featureName: featureName,
      route: route,
      body: {},
      headers: {},
      expectedCase: {
        // Use underscore '_' prefix for unused 'parsed' parameter
        ["should return 400"]: (_parsed, res) => res.status === 400,
      },
      options: [],
      config: config,
      tags: tags,
    });

    const testObjects = generateTestObjects(
      {
        email: { type: "string", notNull: true, isEmail: true },
        password: {
          type: "string",
          notNull: true,
          minLength: 8,
          maxLength: 32,
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
        headers: {},
        expectedCase: {
          ["should return 400"]: (_parsed, res) => res.status === 400,
        },
        options: [],
        config: config,
        tags: tags,
      });
    });
  }

  // --- Positive Case ---
  const registerResult = assertHandler({
    currentTestName: "valid payload",
    featureName: featureName,
    route: route,
    body: positivePayload,
    headers: {},
    expectedCase: {
      ["should return 201"]: (_parsed, res) => res.status === 201,
      ["should have email"]: (parsed, _res) =>
        isExists(parsed, "email", ["string"]),
      ["should have token"]: (parsed, _res) =>
        isExists(parsed, "token", ["string"]),
    },
    options: [],
    config: config,
    tags: tags,
  });

  if (config.runNegativeCase) {
    testPostJsonAssert({
      currentTestName: "email conflict",
      featureName: featureName,
      route: route,
      body: positivePayload,
      headers: {},
      expectedCase: {
        ["should return 409"]: (_parsed, res) => res.status === 409,
      },
      options: [],
      config: config,
      tags: tags,
    });
  }
  return undefined;
  if (registerResult.isSuccess) {
      registeredUserEmail.push({
      email: positivePayload.email,
      token: "Bearer kunciGembokOmaheBapak",
      password: positivePayload.password,
    });
    
    const usr = getUser(registerResult.res, positivePayload, featureName);
    return usr;
  } else {
    console.warn(
      `${featureName} | Skipping getUser due to failed registration assertions.`,
    );
    return undefined;
  }
}