import test from "node:test";
import { z } from "zod";
import TestServer from "../tests/testServer.node.js";

import { promisify } from "node:util";
import child_process from "node:child_process";
import assert from "node:assert";
const exec = promisify(child_process.exec);

const profilePutSchema = z.object({
  preference: z.enum(["WEIGHT", "CARDIO"]),
  weightUnit: z.enum(["KG", "LBS"]),
  heightUnit: z.enum(["CM", "INCH"]),
  weight: z.number().min(10).max(1000),
  height: z.number().min(3).max(250),
  name: z.string().min(2).max(50),
  imageUri: z.string().url().optional(),
});

const s = new TestServer({});

/** @type {string[]} */
s.addRoute("GET", "/v1/user", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      s.sendJsonResponse(res, 200, {
        preference: "",
        weightUnit: "",
        heightUnit: "",
        weight: 10,
        height: 10,
        email: "name@name.com",
        name: "",
        imageUri: ""
      });
    } else {
      s.sendJsonResponse(res, 401, { status: "failed" });
    }
    return;
  } catch (error) {
    s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

/** @type {string[]} */
s.addRoute("PATCH", "/v1/user", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      const body = await s.getRequestBody(req);
      const validate = profilePutSchema.safeParse(body);
      
      if (validate.success) {
        s.sendJsonResponse(res, 200, {
          preference: "",
          weightUnit: "",
          heightUnit: "",
          weight: 10,
          height: 10,
          email: "name@name.com",
          name: "",
          imageUri: ""
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

test("Profile Scenario", async (go) => {
  let serverPort = 0;
  go.before(async () => {
    serverPort = await s.start();
  });
  go.after(() => {
    s.stop();
  });
  go.test("GetProfileScenario should return 0 exit code", async () => {
    const info = {
      user: {
        email: "asdf@adf.com",
        password: "asdfasdf",
        token: "Bearer asdfasdf",
      },
    };
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: `${JSON.stringify(info)}`,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "GetProfileScenario",
        },
      }),
      console.error,
    );
  });

  go.test("PatchProfileScenario should return 0 exit code", async () => {
    const info = {
      user: {
        email: "asdf@adf.com",
        password: "asdfasdf",
        token: "Bearer asdfasdf",
      },
    };
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: `${JSON.stringify(info)}`,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "PatchProfileScenario",
        },
      }),
      console.error,
    );
  });
});