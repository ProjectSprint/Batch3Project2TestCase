import { isActivity } from "../caster/caster.js";
import { isEqual, isEqualWith, isEveryItemDifferent, isExists, isTotalDataInRange, isValidDate, traverseObject } from "../helper/assertion.js";
import { combine, generateRandomName, generateRandomNumber, generateTestObjects } from "../helper/generator.js";
import { testDeleteAssert, testGetAssert, testPatchJsonAssert, testPostJsonAssert } from "../helper/request.js";

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
const activities = ["Walking", "Yoga", "Stretching", "Cycling",
  "Swimming", "Dancing", "Hiking", "Running",
  "HIIT", "JumpRope",
]
/**
 * @param {User} user
 * @param {import("../types/config.d.ts").Config} config
 * @param {{[name: string]: string}} tags
  * @returns {Activity[]}
 */
export function GetActivityTest(user, config, tags) {
  const featureName = "Get Activity";
  const route = config.baseUrl + "/v1/activity";
  const assertHandler = testGetAssert;

  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };
  if (config.runNegativeCase) {
    assertHandler("empty token", featureName, route, {}, {},
      {
        ["should return 401"]: (v) => v.status === 401,
      },
      config, tags,);
    const negativeHeaders = [
      { Authorization: `${user.token}`, },
      { Authorization: `Bearer asdf${user.token}`, },
      { Authorization: ``, },
    ];

    negativeHeaders.forEach((header) => {
      assertHandler("invalid token", featureName, route, {}, header,
        {
          ["should return 401"]: (res) => res.status === 401,
        },
        config, tags,);
    });
  }

  /** @type {import("k6").Checkers<any>} */
  const baseChecks = {
    ["should return 200"]: (v) => v.status === 200,
    ["should have activityId"]: (v) => isExists(v, "[]activityId", ["string"]),
    ["should have activityType"]: (v) => isExists(v, "[]activityType", ["string"]),
    ["should have doneAt"]: (v) => isEqualWith(v, "[]doneAt", (a) => a.every(b => b && isValidDate(b.toString()))),
    ["should have createdAt"]: (v) => isEqualWith(v, "[]createdAt", (a) => a.every(b => b && isValidDate(b.toString()))),
    ["should have durationInMinutes"]: (v) => isExists(v, "[]durationInMinutes", ["number"]),
    ["should have caloriesBurned"]: (v) => isExists(v, "[]caloriesBurned", ["number"]),
  }
  assertHandler("valid payload", featureName, route, {}, positiveHeader,
    baseChecks,
    config, tags,);
  const firstPagination = assertHandler("valid payload with pagination", featureName, route,
    { limit: 2, offset: 0 },
    positiveHeader,
    combine(baseChecks, {
      ['should have the correct total data based on pagination']: (v) => isTotalDataInRange(v, '[]', 1, 2),
    }),
    config, tags,);
  const secondPagination = assertHandler("valid payload with pagination offset", featureName, route,
    { limit: 2, offset: 2 },
    positiveHeader,
    combine(baseChecks, {
      ['should have the correct total data based on pagination']: (v) => isTotalDataInRange(v, '[]', 1, 2),
      ['should have different data from offset 0']: (res) => isEveryItemDifferent(res, firstPagination.res, "[]activityId"),
    }),
    config,
    tags,
  );
  /** @type {import("k6").JSONValue} */
  let firstPagJson = {}
  /** @type {import("k6").JSONValue} */
  let secondPagJson = {}
  try {
    firstPagJson = firstPagination.res.json()
    secondPagJson = secondPagination.res.json()
  } catch (e) {
    console.log(featureName + " | failed to parse json", e)
  }
  /** @type {import("k6").JSONValue[]} */
  let activities = []
  if (Array.isArray(firstPagJson) && Array.isArray(secondPagJson)) {
    firstPagJson.forEach(i => activities.push(i))
    secondPagJson.forEach(i => activities.push(i))
  }
  let caloriesMin = 1;
  let caloriesMax = 1;
  if (firstPagination.isSuccess && secondPagination.isSuccess) {
    const calories = traverseObject(activities, "[]caloriesBurned")
      .map(value => Number(value))
      .sort((a, b) => {
        if (a !== undefined && typeof a === "number" &&
          b !== undefined && typeof b === "number" &&
          !isNaN(a) && !isNaN(b)) {
          return a - b;
        }
        return 0;
      });

    const min = Math.floor(calories.length / 4);
    const max = min + Math.floor(calories.length / 2);

    const minValue = calories[min];
    const maxValue = calories[max];

    caloriesMin = minValue !== undefined && !isNaN(minValue) ? minValue : 1;
    caloriesMax = maxValue !== undefined && !isNaN(maxValue) ? maxValue : 10;
  }

  const beforeTime = new Date()
  const currentHour = beforeTime.getHours()
  beforeTime.setHours(currentHour - 1)
  const oneHourAgo = beforeTime.toISOString()

  const afterTime = new Date()
  afterTime.setHours(currentHour + 1)
  const oneHourAfter = afterTime.toISOString()

  assertHandler("valid payload with doneAtFrom", featureName, route,
    { doneAtFrom: oneHourAgo },
    positiveHeader,
    combine(baseChecks, {
      ["should have doneAt that is more than query"]: (v) => isEqualWith(v, "[]doneAt", (a) => a.every(b => b && beforeTime < new Date(b.toString()))),
    }),
    config, tags,);
  assertHandler("valid payload with doneAtFrom", featureName, route,
    { doneAtTo: oneHourAfter },
    positiveHeader,
    combine(baseChecks, {
      ["should have doneAt that is less than query"]: (v) => isEqualWith(v, "[]doneAt", (a) => a.every(b => b && afterTime > new Date(b.toString()))),
    }),
    config, tags,);
  assertHandler("valid payload with doneAtFrom & doneAtTo", featureName, route,
    { doneAtTo: oneHourAfter, doneAtFrom: oneHourAgo },
    positiveHeader,
    combine(baseChecks, {
      ["should have doneAt in range"]: (v) => isEqualWith(v, "[]doneAt", (a) => a.every(b => b && beforeTime < new Date(b.toString()) && afterTime > new Date(b.toString()))),
    }),
    config, tags,);
  assertHandler("valid payload with caloriesBurnedMin", featureName, route,
    { caloriesBurnedMin: caloriesMin },
    positiveHeader,
    combine(baseChecks, {
      ["should have caloriesBurned more than query"]: (v) => isEqualWith(v, "[]caloriesBurned", (a) => a.every(b => b && typeof b === "number" && b >= caloriesMin)),
    }),
    config, tags,);
  assertHandler("valid payload with caloriesBurnedMax", featureName, route,
    { caloriesBurnedMax: caloriesMax },
    positiveHeader,
    combine(baseChecks, {
      ["should have caloriesBurned less than query"]: (v) => isEqualWith(v, "[]caloriesBurned", (a) => a.every(b => b && typeof b === "number" && b <= caloriesMax)),
    }),
    config, tags,);
  assertHandler("valid payload with caloriesBurnedMin & caloriesBurnedMax", featureName, route,
    { caloriesBurnedMin: caloriesMin, caloriesBurnedMax: caloriesMax },
    positiveHeader,
    combine(baseChecks, {
      ["should have caloriesBurned in range"]: (v) => isEqualWith(v, "[]caloriesBurned", (a) => a.every(b => b && typeof b === "number" && b <= caloriesMax && b >= caloriesMin)),
    }),
    config, tags,);

  return activities.every(a => isActivity(a)) ? activities : []
}
/**
 * @param {User} user
 * @param {import("../types/config.d.ts").Config} config
 * @param {{[name: string]: string}} tags
  * @returns {Activity|undefined}
 */
export function PostActivityTest(user, config, tags) {
  const featureName = "Post Activity";
  const route = config.baseUrl + "/v1/activity";
  const assertHandler = testPostJsonAssert;

  const duration = generateRandomNumber(2, 100)
  const choosenActivity = activities[generateRandomNumber(0, activities.length - 1)]
  const calorieBurned = duration * activitiesCalories[choosenActivity]
  const positivePayload = {
    activityType: choosenActivity,
    doneAt: new Date().toISOString(),
    durationInMinutes: duration,
  };
  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };
  if (config.runNegativeCase) {
    assertHandler("empty token", featureName, route, {}, {},
      {
        ["should return 401"]: (v) => v.status === 401,
      }, [], config, tags,
    );
    const negativeHeaders = [
      { Authorization: `${user.token}`, },
      { Authorization: `Bearer asdf${user.token}`, },
      { Authorization: ``, },
    ];

    negativeHeaders.forEach((header) => {
      assertHandler("invalid token", featureName, route, {}, header,
        {
          ["should return 401"]: (res) => res.status === 401,
        },
        [], config, tags,);
    });
    const negativeTestObjects = generateTestObjects(
      {
        activityType: {
          type: "string",
          notNull: true,
          enum: activities
        },
        doneAt: {
          type: "string",
          notNull: true
        },
        durationInMinutes: {
          type: "number",
          min: 1
        }
      },
      positivePayload,
    );
    negativeTestObjects.forEach((payload) => {
      assertHandler("invalid payload", featureName, route, payload, positiveHeader,
        {
          ["should return 400"]: (res) => res.status === 400,
        },
        [], config, tags,);
    });
    assertHandler("invalid content type", featureName, route, positivePayload, positiveHeader,
      {
        ["should return 400"]: (res) => res.status === 400,
      },
      ["noContentType"], config, tags,);
  }

  const res = assertHandler("valid payload", featureName, route, positivePayload, positiveHeader,
    {
      ["should return 201"]: (v) => v.status === 201,
      ["should have activityId"]: (v) => isExists(v, "activityId", ["string"]),
      ["should have activityType"]: (v) => isExists(v, "activityType", ["string"]),
      ["should have doneAt"]: (v) => isEqualWith(v, "doneAt", (a) => a.every(b => b && isValidDate(b.toString()))),
      ["should have durationInMinutes"]: (v) => isExists(v, "durationInMinutes", ["number"]),
      ["should have caloriesBurned"]: (v) => isEqual(v, "caloriesBurned", calorieBurned),
      ["should have createdAt"]: (v) => isEqualWith(v, "createdAt", (a) => a.every(b => b && isValidDate(b.toString()))),
      ["should have updatedAt"]: (v) => isEqualWith(v, "updatedAt", (a) => a.every(b => b && isValidDate(b.toString()))),
    },
    [], config, tags,);
  if (res.isSuccess) {
    try {
      const jsonResult = res.res.json();
      if (jsonResult && isActivity(jsonResult)) {
        return jsonResult
      }
    } catch (e) {
      console.log(featureName + " | failed to parse json", e)
    }
  }
}

/**
 * @param {User} user
 * @param {Activity} activity
 * @param {import("../types/config.d.ts").Config} config
 * @param {{[name: string]: string}} tags
 * @returns {Activity | undefined}
 */
export function PatchActivityTest(user, activity, config, tags) {
  const featureName = "Patch Activity";
  const routeWithoutId = config.baseUrl + "/v1/activity";
  const route = routeWithoutId + `/${activity.activityId}`;
  const assertHandler = testPatchJsonAssert;

  const duration = generateRandomNumber(1, 100)
  const choosenActivity = activities[generateRandomNumber(0, activities.length - 1)]
  const calorieBurned = duration * activitiesCalories[choosenActivity]
  const positivePayload = {
    activityType: choosenActivity,
    doneAt: new Date().toISOString(),
    durationInMinutes: duration,
  };
  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };
  if (config.runNegativeCase) {
    assertHandler("empty token", featureName, route, {}, {},
      {
        ["should return 401"]: (v) => v.status === 401,
      },
      [], config, tags,
    );
    const negativeHeaders = [
      { Authorization: `${user.token}`, },
      { Authorization: `Bearer asdf${user.token}`, },
      { Authorization: ``, },
    ];

    negativeHeaders.forEach((header) => {
      assertHandler("invalid token", featureName, route, {}, header,
        {
          ["should return 401"]: (res) => res.status === 401,
        },
        [], config, tags,);
    });
    const negativeTestObjects = generateTestObjects(
      {
        activityType: {
          type: "string",
          notNull: true,
          enum: activities
        },
        doneAt: {
          type: "string",
          notNull: true
        },
        durationInMinutes: {
          type: "number",
          min: 1
        }
      },
      positivePayload,
    );
    negativeTestObjects.forEach((payload) => {
      assertHandler("invalid payload", featureName, route, payload, positiveHeader,
        {
          ["should return 400"]: (res) => res.status === 400,
        },
        [], config, tags,);
    });
    assertHandler("invalid content type", featureName, route, positivePayload, positiveHeader,
      {
        ["should return 400"]: (res) => res.status === 400,
      },
      ["noContentType"], config, tags,);
    assertHandler("not exists id", featureName, `${routeWithoutId}/`, positivePayload, positiveHeader,
      {
        ["should return 404"]: (res) => res.status === 404,
      },
      [], config, tags,);
    assertHandler("invalid id", featureName, `${routeWithoutId}/${generateRandomName()}`, positivePayload, positiveHeader,
      {
        ["should return 404"]: (res) => res.status === 404,
      },
      [], config, tags,
    );
  }

  const res = assertHandler("valid payload", featureName, route, positivePayload, positiveHeader,
    {
      ["should return 200"]: (v) => v.status === 200,
      ["should have activityId"]: (v) => isEqual(v, "activityId", activity.activityId),
      ["should have activityType"]: (v) => isEqual(v, "activityType", positivePayload.activityType),
      ["should have doneAt"]: (v) => isEqual(v, "doneAt", positivePayload.doneAt),
      ["should have durationInMinutes"]: (v) => isEqual(v, "durationInMinutes", positivePayload.durationInMinutes),
      ["should have caloriesBurned"]: (v) => isEqual(v, "caloriesBurned", calorieBurned),
      ["should have createdAt"]: (v) => isEqualWith(v, "createdAt", (a) => a.every(b => b && isValidDate(b.toString()))),
      ["should have updatedAt"]: (v) => isEqualWith(v, "updatedAt", (a) => a.every(b => b && isValidDate(b.toString()))),
    },
    [], config, tags,
  );

  if (res.isSuccess) {
    try {
      const jsonResult = res.res.json();
      if (jsonResult && isActivity(jsonResult)) {
        return jsonResult
      }
    } catch (e) {
      console.log(featureName + " | failed to parse json", e)
    }
  }
}

/**
 * @param {User} user
 * @param {Activity} activity
 * @param {import("../types/config.d.ts").Config} config
 * @param {{[name: string]: string}} tags
 */
export function DeleteActivityTest(user, activity, config, tags) {
  const featureName = "Delete Activity";
  const routeWithoutId = config.baseUrl + "/v1/activity";
  const route = routeWithoutId + `/${activity.activityId}`;
  const assertHandler = testDeleteAssert;

  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };
  if (config.runNegativeCase) {
    assertHandler("empty token", featureName, route, {}, {}, {},
      {
        ["should return 401"]: (v) => v.status === 401,
      },
      config, tags,);
    const negativeHeaders = [
      { Authorization: `${user.token}`, },
      { Authorization: `Bearer asdf${user.token}`, },
      { Authorization: ``, },
    ];

    negativeHeaders.forEach((header) => {
      assertHandler("invalid token", featureName, route, {}, {}, header,
        {
          ["should return 401"]: (res) => res.status === 401,
        },
        config, tags,);
    });
    assertHandler("not exists id", featureName, `${routeWithoutId}/`, {}, {}, positiveHeader,
      {
        ["should return 404"]: (res) => res.status === 404,
      },
      config, tags,);
    assertHandler("invalid id", featureName, `${routeWithoutId}/${generateRandomName()}`, {}, {}, positiveHeader,
      {
        ["should return 404"]: (res) => res.status === 404,
      },
      config, tags,);
  }

  assertHandler("valid payload", featureName, route, {}, {}, positiveHeader,
    {
      ["should return 200"]: (v) => v.status === 200,
    },
    config, tags,);
}

