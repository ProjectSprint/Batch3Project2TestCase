import { isUser } from "../assertion/userAssertion.js";
import { getActivitites, getActivity } from "../assertion/activityAssertion.js";
import { isEqual, isEqualWith, isEveryItemDifferent, isExists, isTotalDataInRange, isValidDate, traverseObject } from "../helper/assertion.js";
import { clone, combine, generateRandomName, generateRandomNumber, generateTestObjects } from "../helper/generator.js";
import { testDeleteAssert, testGetAssert, testPatchJsonAssert, testPostJsonAssert } from "../helper/testRequest.js";

/** @type {Object<string, number>} */
const activitiesCalories = {
  Walking: 4,
  Yoga: 4,
  Stretching: 4,
  Cycling: 8,
  Swimming: 8,
  Dancing: 8,
  Hiking: 10,
  Running: 10,
  HIIT: 10,
  JumpRope: 10
};

/**
 * @type {string[]}
*/
const activities = ["Walking", "Yoga", "Stretching", "Cycling",
  "Swimming", "Dancing", "Hiking", "Running",
  "HIIT", "JumpRope",
]

/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").Activity[] | undefined>}
 */
export function GetActivityScenario(config, tags, info) {
  const featureName = "Get Activity";
  const route = config.baseUrl + "/v1/activity";
  const assertHandler = testGetAssert;

  let user = info.user; 
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "no token",
      featureName: featureName,
      route: route,
      headers: {},
      params: {},
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
      config: config,
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
    currentTestName: "success get product",
    expectedCase: {
          ["should return 200"]: (_parsed, res) => res.status === 200,
          
          ["activityId should be string"]: (parsed, _res) => 
            isExists(parsed, "[].activityId", ["string"]),
          ["activityType should be string"]: (parsed, _res) =>
            isExists(parsed, "[].activityType", ["string"]),
          ["doneAt should be string"]: (parsed, _res) =>
            isExists(parsed, "[].doneAt", ["string"]),
          ["durationInMinutes should be number"]: (parsed, _res) =>
            isExists(parsed, "[].durationInMinutes", ["number"]),
          ["createdAt should be string"]: (parsed, _res) =>
            isExists(parsed, "[].createdAt", ["string"]),
        },
    tags: {},
  });


  if (positiveResult.isSuccess) {
    return getActivitites(positiveResult.res, {}, featureName);
  } else {
    console.warn(
        `${featureName} | Skipping getProduct due to failed assertions.`,
      );
    return undefined;
  }
}
/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").Activity | undefined>}
 */
export function PostActivityScenario(config, tags, info) {
  const featureName = "Post Activity";
  const route = config.baseUrl + "/v1/activity";
  const assertHandler = testPostJsonAssert;

  let user = info.user; 
  console.log("user", user);
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  const duration = generateRandomNumber(2, 100);
  const choosenActivity = activities[generateRandomNumber(0, activities.length - 1)];
  const calorieBurned = duration * activitiesCalories[choosenActivity];

  const positivePayload = {
    activityType: activities[generateRandomNumber(0, activities.length - 1)],
    doneAt: new Date().toISOString(),
    durationInMinutes: duration,
  };

  const negativePayload = clone(positivePayload);
  negativePayload.activityType = "invalidActivityType";

  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "no token",
      featureName: featureName,
      route: route,
      headers: {},
      body: {},
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
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
        activityType: {
          type: "string",
          enum: activities
        },
        doneAt: {
          type: "string"
        },
        durationInMinutes: {
          type: "number",
          min: 1,
        },
      },
      positivePayload
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
    featureName: featureName,
    config: config,
    route: route,
    body: positivePayload,
    headers: { Authorization: user.token },
    currentTestName: "success get product",
    expectedCase: {
          ["should return 201"]: (_parsed, res) => res.status === 201,
          
          ["activityId should be string"]: (parsed, _res) => 
            isExists(parsed, "activityId", ["string"]),
          ["activityType should be string"]: (parsed, _res) =>
            isExists(parsed, "activityType", ["string"]),
          ["doneAt should be string"]: (parsed, _res) =>
            isExists(parsed, "doneAt", ["string"]),
          ["durationInMinutes should be number"]: (parsed, _res) =>
            isExists(parsed, "durationInMinutes", ["number"]),
          ["createdAt should be string"]: (parsed, _res) =>
            isExists(parsed, "createdAt", ["string"]),
        },
    tags: {},
  });

  if (positiveResult.isSuccess) {
      return getActivity(positiveResult.res, {}, featureName);
    } else {
      console.warn(
        `${featureName} | Skipping getActivity due to failed assertions.`,
      );
      return undefined;
    }
}

/**
 * @type {import("src/types/scenario.js").Scenario<import("src/entity/app.js").Activity | undefined>}
 */
export function PatchActivityScenario(config, tags, info) {
  const featureName = "Patch Activity";
  const route = config.baseUrl + "/v1/activity/:activityId";
  const assertHandler = testPatchJsonAssert;

  let user = info.user; 
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  /**
   * @type {string}
   */
  const activityId = info.activityId;

  const duration = generateRandomNumber(2, 100);
  const choosenActivity = activities[generateRandomNumber(0, activities.length - 1)];
  const calorieBurned = duration * activitiesCalories[choosenActivity];

  const positivePayload = {
    activityId: activityId,
    activityType: activities[generateRandomNumber(0, activities.length - 1)],
    doneAt: new Date().toISOString(),
    durationInMinutes: duration,
  };

  const negativePayload = clone(positivePayload);
  negativePayload.activityType = "invalidActivityType";
  negativePayload.activityId = "invalidId";

  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "no token",
      featureName: featureName,
      route: route,
      headers: {},
      body: {},
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
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
        activityId: {
          type: "string"
        },
        activityType: {
          type: "string",
          enum: activities
        },
        doneAt: {
          type: "string"
        },
        durationInMinutes: {
          type: "number",
          min: 1,
        },
      },
      positivePayload
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
      assertHandler({
        currentTestName: "activityId not found",
        featureName: featureName,
        route: route,
        body: negativePayload,
        headers: { Authorization: user.token },
        expectedCase: {
          ["should return 404"]: (_parsed, res) => res.status === 404,
        },
        options: [],
        config: config,
        tags: {},  
      });
    });
  }

  // --- Positive Case ---
  const positiveResult = assertHandler({
    featureName: featureName,
    config: config,
    route: route,
    body: positivePayload,
    headers: { Authorization: user.token },
    currentTestName: "success post activity",
    expectedCase: {
          ["should return 200"]: (_parsed, res) => res.status === 200,
          
          ["activityId should be string"]: (parsed, _res) => 
            isExists(parsed, "activityId", ["string"]),
          ["activityType should be string"]: (parsed, _res) =>
            isExists(parsed, "activityType", ["string"]),
          ["doneAt should be string"]: (parsed, _res) =>
            isExists(parsed, "doneAt", ["string"]),
          ["durationInMinutes should be number"]: (parsed, _res) =>
            isExists(parsed, "durationInMinutes", ["number"]),
          ["createdAt should be string"]: (parsed, _res) =>
            isExists(parsed, "createdAt", ["string"]),
        },
    tags: {},
  });

  if (positiveResult.isSuccess) {
      return getActivity(positiveResult.res, {}, featureName);
    } else {
      console.warn(
        `${featureName} | Skipping getActivity due to failed assertions.`,
      );
      return undefined;
    }
}

/**
 * @type {import("src/types/scenario.js").Scenario<number | undefined>}
 */
export function DeleteActivityScenario(config, tags, info) {
  const featureName = "Delete Activity";
  const route = config.baseUrl + "/v1/activity/:activityId";
  const assertHandler = testDeleteAssert;

  let user = info.user; 
  if (!isUser(user)) {
    console.warn(`${featureName} needs a valid user`);
    return undefined;
  }

  /**
   * @type {string}
   */
  const activityId = info.activityId;

  if (config.runNegativeCase) {
    assertHandler({
      currentTestName: "no token",
      featureName: featureName,
      route: route,
      params: {},
      headers: {},
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
      config: config,
      tags: {},
    });

    // karena belum tau caranya kirim parameter :activityId. Jadi minjem headers agar bisa ditangkap di .test.js
    assertHandler({
      currentTestName: "activityId not found",
      featureName: featureName,
      route: route,
      params: {},
      headers: { 
        Authorization: user.token,
        Query: "kan"
      },
      expectedCase: {
        ["should return 404"]: (_parsed, res) => res.status === 404,
      },
      config: config,
      tags: {},
    });
  }

  // ---- Positive Case ----
  const positiveResult = assertHandler({
      currentTestName: "valid payload",
      featureName: featureName,
      route: route,
      params: {},
      headers: { Authorization: user.token, Query: activityId},
      expectedCase: {
        ["should return 200"]: (_parsed, res) => res.status === 200,
      },
      config: config,
      tags: {},
    });
  if (positiveResult.isSuccess) {
      return 200;
    } else {
      console.warn(
        `${featureName} | Skipping return 200 due to failed assertions.`,
      );
      return undefined;
    }
}

