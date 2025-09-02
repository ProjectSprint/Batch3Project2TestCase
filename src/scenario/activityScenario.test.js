import test from "node:test";

import { promisify } from "node:util";
import child_process from "node:child_process";
import assert from "node:assert";
import { activityScenarioServer as s } from "./activityScenario.test.server.js";

const exec = promisify(child_process.exec);

test("Activity Scenario", async (go) => {
  let serverPort = 0;
  go.before(async () => {
    serverPort = await s.start();
  });
  go.after(() => {
    s.stop();
  });

  // go.test("PostActivityScenario should return 0 exit code", async () => {
  //   const info = {
  //     user: {
  //       email: "asdf@adf.com",
  //       password: "asraf123",
  //       token: "Bearer asraf123",
  //     },
  //   };
  //   await assert.doesNotReject(
  //     exec(`${process.env.K6_PATH} run src/main.js`, {
  //       env: {
  //         BASE_URL: `http://127.0.0.1:${serverPort}`,
  //         MOCK_INFO: `${JSON.stringify(info)}`,
  //         RUN_UNIT_TEST: "true",
  //         SCENARIO_NAME: "PostActivityScenario",
  //       },
  //     }),
  //     console.error,
  //   );
  // });

  go.test("GetActivityScenario should return 0 exit code", async () => {
    const info = {
      user: {
        email: "asdf@adf.com",
        password: "asraf123",
        token: "Bearer asraf123",
      },
      testBeginTime: new Date().toISOString(),
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

  // go.test("PatchActivityScenario should return 0 exit code", async () => {
  //   const info = {
  //     activityId: "act1",
  //     user: {
  //       email: "asdf@adf.com",
  //       password: "asraf123",
  //       token: "Bearer asraf123",
  //     },
  //   };
  //   await assert.doesNotReject(
  //     exec(`${process.env.K6_PATH} run src/main.js`, {
  //       env: {
  //         BASE_URL: `http://127.0.0.1:${serverPort}`,
  //         MOCK_INFO: `${JSON.stringify(info)}`,
  //         RUN_UNIT_TEST: "true",
  //         SCENARIO_NAME: "PatchActivityScenario",
  //       },
  //     }),
  //     console.error,
  //   );
  // });

  // go.test("DeleteActivityScenario should return 0 exit code", async () => {
  //   const info = {
  //     activityId: "act1",
  //     user: {
  //       email: "asdf@adf.com",
  //       password: "asraf123",
  //       token: "Bearer asraf123",
  //     },
  //   };
  //   await assert.doesNotReject(
  //     exec(`${process.env.K6_PATH} run src/main.js`, {
  //       env: {
  //         BASE_URL: `http://127.0.0.1:${serverPort}`,
  //         MOCK_INFO: `${JSON.stringify(info)}`,
  //         RUN_UNIT_TEST: "true",
  //         SCENARIO_NAME: "DeleteActivityScenario",
  //       },
  //     }),
  //     console.error,
  //   );
  // });
});
