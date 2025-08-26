import test from "node:test";
import { z } from "zod";
import TestServer from "../tests/testServer.node.js";

import { promisify } from "node:util";
import child_process from "node:child_process";
import assert from "node:assert";
import { isValidDate } from "../helper/assertion.js";
import url from "url";

const exec = promisify(child_process.exec);
/**
 * @type {string[]}
 */
const activities = [
  "Walking",
  "Yoga",
  "Stretching",
  "Cycling",
  "Swimming",
  "Dancing",
  "Hiking",
  "Running",
  "HIIT",
  "JumpRope",
];
const postSchema = z.object({
  activityType: z.enum([
    "Cycling",
    "Dancing",
    "HIIT",
    "Hiking",
    "JumpRope",
    "Running",
    "Stretching",
    "Swimming",
    "Walking",
    "Yoga",
  ]),
  doneAt: z.string(),
  durationInMinutes: z.number().min(1),
});

const patchSchema = z.object({
  activityId: z.string(),
  activityType: z.enum([
    "Walking",
    "Yoga",
    "Stretching",
    "Cycling",
    "Swimming",
    "Dancing",
    "Hiking",
    "Running",
    "HIIT",
    "JumpRope",
  ]),
  doneAt: z.string(),
  durationInMinutes: z.number().min(1),
});

const deleteSchema = z.object({
  activityId: z.string(),
});

const s = new TestServer({});

/** @type {string[]} */
const validActivityId = ["act1", "act2", "act3"];

/** @type {number} */
let activityIdCount = 1;

/** @type {string[]} */
const availableActivity = ["1", "2"];

/** @type {string[]} */
s.addRoute("POST", "/v1/activity", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const body = await s.getRequestBody(req);
      const validate = postSchema.safeParse(body);
      if (validate.success) {
        if (!isValidDate(validate.data.doneAt)) {
          s.sendJsonResponse(res, 400, { status: "failed" });
          return;
        }

        let activityId = "act" + activityIdCount++;
        availableActivity.push(activityId);

        s.sendJsonResponse(res, 201, {
          activityId: activityId,
          activityType: body.activityType,
          doneAt: body.doneAt,
          durationInMinutes: body.durationInMinutes,
          caloriesBurned: 5,
          createdAt: "",
          updatedAt: "",
        });
      } else {
        s.sendJsonResponse(res, 400, { status: "failed" });
      }
    } else {
      s.sendJsonResponse(res, 401, { status: "failed" });
    }
    return;
  } catch (error) {
    s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

/** @type {string[]} */
s.addRoute("PATCH", "/v1/activity/:activityId", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const body = await s.getRequestBody(req);
      const validate = patchSchema.safeParse(body);
      if (validate.success) {
        if (!availableActivity.includes(validate.data.activityId)) {
          s.sendJsonResponse(res, 404, { status: "failed" });
          return;
        }

        if (!isValidDate(validate.data.doneAt)) {
          s.sendJsonResponse(res, 400, { status: "failed" });
          return;
        }

        s.sendJsonResponse(res, 200, {
          activityId: body.activityId,
          activityType: body.activityType,
          doneAt: body.doneAt,
          durationInMinutes: body.durationInMinutes,
          caloriesBurned: 5,
          createdAt: "",
          updatedAt: "",
        });
      } else {
        s.sendJsonResponse(res, 400, { status: "failed" });
      }
    } else {
      s.sendJsonResponse(res, 401, { status: "failed" });
    }
    return;
  } catch (error) {
    s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

/** @type {string[]} */
s.addRoute("GET", "/v1/activity", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      s.sendJsonResponse(res, 200, [
        {
          activityId: "",
          activityType: "Yoga",
          doneAt: "",
          durationInMinutes: 1,
          caloriesBurned: 5,
          createdAt: "",
          updatedAt: "",
        },
        {
          activityId: "",
          activityType: "Walking",
          doneAt: "",
          durationInMinutes: 1,
          caloriesBurned: 5,
          createdAt: "",
          updatedAt: "",
        },
      ]);
    } else {
      s.sendJsonResponse(res, 401, { status: "failed" });
    }
    return;
  } catch (error) {
    s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

/** @type {string[]} */
s.addRoute("DELETE", "/v1/activity/:activityId", async (req, res) => {
  try {
    // Check authorization
    if (!req.headers.authorization?.startsWith("Bearer")) {
      return s.sendJsonResponse(res, 401, { status: "failed" });
    }

    // Extract activityId from URL path
    if (!req.url) {
      return s.sendJsonResponse(res, 400, { status: "failed" });
    }

    const parsedUrl = url.parse(req.url, true);
    const pathSegments = parsedUrl.pathname?.split("/").filter(Boolean) || [];

    // For "/v1/activity/:activityId", the activityId should be at index 2
    const activityId = pathSegments[2];

    if (!activityId || !availableActivity.includes(activityId)) {
      return s.sendJsonResponse(res, 404, { status: "failed" });
    }

    return s.sendJsonResponse(res, 200, {});
  } catch (error) {
    console.error("Error in DELETE /v1/activity/:activityId:", error);
    return s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

test("Activity Scenario", async (go) => {
  let serverPort = 0;
  go.before(async () => {
    serverPort = await s.start();
  });
  go.after(() => {
    s.stop();
  });

  go.test("PostActivityScenario should return 0 exit code", async () => {
    const info = {
      user: {
        email: "asdf@adf.com",
        password: "asraf123",
        token: "Bearer asraf123",
      },
    };
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: `${JSON.stringify(info)}`,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "PostActivityScenario",
        },
      }),
      console.error,
    );
  });

  go.test("GetActivityScenario should return 0 exit code", async () => {
    const info = {
      user: {
        email: "asdf@adf.com",
        password: "asraf123",
        token: "Bearer asraf123",
      },
    };
    await assert.doesNotReject(async () => {
      const result = await exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: `${JSON.stringify(info)}`,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "GetActivityScenario",
          DEBUG: "true",
        },
      });
      console.log("k6 stdout", result.stdout);
      console.log("k6 stderr", result.stderr);
    }, console.error);
  });

  go.test("PatchActivityScenario should return 0 exit code", async () => {
    const info = {
      activityId: "act1",
      user: {
        email: "asdf@adf.com",
        password: "asraf123",
        token: "Bearer asraf123",
      },
    };
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: `${JSON.stringify(info)}`,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "PatchActivityScenario",
        },
      }),
      console.error,
    );
  });

  go.test("DeleteActivityScenario should return 0 exit code", async () => {
    const info = {
      activityId: "act1",
      user: {
        email: "asdf@adf.com",
        password: "asraf123",
        token: "Bearer asraf123",
      },
    };
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: `${JSON.stringify(info)}`,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "DeleteActivityScenario",
        },
      }),
      console.error,
    );
  });
});
