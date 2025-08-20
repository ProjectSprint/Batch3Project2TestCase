import test from "node:test";
import { z } from "zod";
import TestServer from "../tests/testServer.node.js";

import { promisify } from "node:util";
import child_process from "node:child_process";
import assert from "node:assert";
const exec = promisify(child_process.exec);

// Password schema used across multiple requests
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(32, { message: "Password must be no more than 32 characters long" });

const LoginEmailRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: passwordSchema,
});

const RegisterEmailRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: passwordSchema,
});

const s = new TestServer({});

/** @type {string[]} */
const registerdEmail = ["mas@gmail.com"];
s.addRoute("POST", "/v1/register", async (req, res) => {
  try {
    const body = await s.getRequestBody(req);
    const validate = RegisterEmailRequestSchema.safeParse(body);
    if (!validate.success) {
      s.sendJsonResponse(res, 400, { status: "failed" });
      return;
    }
    if (registerdEmail.includes(validate.data.email)) {
      s.sendJsonResponse(res, 409, { status: "failed" });
      return;
    }
    registerdEmail.push(validate.data.email);
    s.sendJsonResponse(res, 201, {
      email: validate.data.email,
      token: "token",
    });
    return;
  } catch (error) {
    s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

s.addRoute("POST", "/v1/login", async (req, res) => {
  try {
    const body = await s.getRequestBody(req);
    const validate = RegisterEmailRequestSchema.safeParse(body);
    if (!validate.success) {
      s.sendJsonResponse(res, 400, { status: "failed" });
      return;
    }
    if (!registerdEmail.includes(validate.data.email)) {
      s.sendJsonResponse(res, 404, { status: "failed" });
      return;
    }
    s.sendJsonResponse(res, 200, {
      email: validate.data.email,
      token: "token",
    });
    return;
  } catch (error) {
    s.sendJsonResponse(res, 500, { status: "failed" });
  }
});

test("Register Scenario", async (go) => {
  let serverPort = 0;
  go.before(async () => {
    serverPort = await s.start();
  });
  go.after(() => {
    s.stop();
  });
  go.test("RegisterScenario should return 0 exit code", async () => {
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          MOCK_INFO: ``,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "RegisterScenario",
        },
      }),
      console.error,
    );
  });

  go.test("LoginSceario should return 0 exit code", async () => {
    await assert.doesNotReject(
      exec(`${process.env.K6_PATH} run src/main.js`, {
        env: {
          BASE_URL: `http://127.0.0.1:${serverPort}`,
          // MOCK_INFO: `${JSON.stringify(info)}`,
          MOCK_INFO: ``,
          RUN_UNIT_TEST: "true",
          SCENARIO_NAME: "LoginScenario",
        },
      }),
      console.error,
    );
  });
});
