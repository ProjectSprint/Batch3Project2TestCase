import { z } from "zod";
import TestServer from "../tests/testServer.node.js";

import { isValidDate } from "../helper/assertion.js";
import url from "url";
import {
  generateRandomDate,
  generateRandomNumber,
} from "../helper/generator.js";

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
      const activityId = s.getGetPathValue(req, 2);
      if (!validActivityId.includes(activityId)) {
        s.sendJsonResponse(res, 400, { status: "failed" });
      }

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
/** @param {{}} orig */
function newActivity(orig) {
  return {
    activityId: crypto.randomUUID(),
    ActivityType: activities[0],
    durationInMinutes: generateRandomNumber(0, 100),
    doneAt: new Date().toISOString(),
    caloriesBurned: generateRandomNumber(10, 500),
    createdAt: new Date().toISOString(),
    ...orig,
  };
}
/** @param {{}} orig
 * @param {number} count
 * */
function generateActivity(orig, count) {
  const result = [];
  for (let index = 0; index < count; index++) {
    result.push(newActivity(orig));
  }
  return result;
}
/** @type {string[]} */
s.addRoute("GET", "/v1/activity", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const query = s.parseQueryParams(req);

      let result = [];
      if (Object.keys(query)) {
        if (query["limit"] && query["offset"]) {
          if (typeof query["limit"] === "string") {
            result = [...generateActivity({}, parseInt(query["limit"]))];
          }
        }
        if (
          query["doneAtFrom"] &&
          query["doneAtTo"] &&
          typeof query["doneAtFrom"] === "string" &&
          typeof query["doneAtTo"] === "string"
        ) {
          result = [
            ...generateActivity(
              {
                doneAt: generateRandomDate(
                  parseInt(query["doneAtFrom"]),
                  parseInt(query["doneAtTo"]),
                ),
              },
              5,
            ),
          ];
        }
        if (
          query["caloriesBurnedMin"] &&
          query["caloriesBurnedMax"] &&
          typeof query["caloriesBurnedMin"] === "string" &&
          typeof query["caloriesBurnedMax"] === "string"
        ) {
          result = [
            ...generateActivity(
              {
                caloriesBurned: generateRandomNumber(
                  parseInt(query["caloriesBurnedMin"]),
                  parseInt(query["caloriesBurnedMax"]),
                ),
              },
              5,
            ),
          ];
        }
      }
      s.sendJsonResponse(res, 200, []);
    }
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

export const activityScenarioServer = s;
