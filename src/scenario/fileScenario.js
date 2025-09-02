import { file, get } from "k6/http";
import { check } from "k6";
import { getFile, isFile } from "../assertion/fileAssertion.js";
import { testPostMultipartAssert } from "../helper/testRequest.js";
import { isExists } from "../helper/assertion.js";

/**
 * @param {import("src/entity/app.js").User} user // Adjusted path, verify correctness
 * @param {{small: ArrayBuffer, smallName:string,medium: ArrayBuffer, mediumName:string,big: ArrayBuffer, bigName: string,invalid: ArrayBuffer,invalidName:string}} fileToTest
 * @param {import("src/types/config.js").Config} config
 * @param {{[name: string]: string}} tags
 * @returns {import("src/entity/app.js").UploadedFile | undefined} uri
 */
export function UploadFileScenario(user, fileToTest, config, tags) {
  const featureName = "Upload File";
  const route = config.baseUrl + "/v1/file";
  const assertHandler = testPostMultipartAssert;

  const positivePayload = {
    file: file(fileToTest.small, fileToTest.smallName),
  };
  const positiveHeader = {
    Authorization: `Bearer ${user.token}`,
  };

  if (config.runNegativeCase) {
    // Test without Authorization header
    assertHandler({
      currentTestName: "empty token",
      featureName: featureName,
      route: route,
      body: positivePayload, // Need a body for multipart request usually
      headers: {}, // No auth header
      expectedCase: {
        ["should return 401"]: (_parsed, res) => res.status === 401,
      },
      config: config,
      tags: tags,
    });

    // Test with invalid Authorization headers
    const negativeHeaders = [
      { Authorization: `${user.token}` }, // Missing Bearer prefix
      { Authorization: `Bearer asdf${user.token}` }, // Invalid token
      { Authorization: `Bearer ` }, // Empty token
      { Authorization: `` }, // Empty header value
    ];

    negativeHeaders.forEach((header, index) => {
      assertHandler({
        currentTestName: `invalid token ${index + 1}`,
        featureName: featureName,
        route: route,
        body: positivePayload, // Need a body for multipart request
        headers: header,
        expectedCase: {
          ["should return 401"]: (_parsed, res) => res.status === 401,
        },
        config: config,
        tags: tags,
      });
    });

    // Test invalid file type
    assertHandler({
      currentTestName: "invalid file type",
      featureName: featureName,
      route: route,
      body: {
        file: file(fileToTest.invalid, fileToTest.invalidName),
      },
      headers: positiveHeader,
      expectedCase: {
        ["should return 400"]: (_parsed, res) => res.status === 400,
      },
      config: config,
      tags: tags,
    });

    // Test invalid file size
    assertHandler({
      currentTestName: "invalid file size",
      featureName: featureName,
      route: route,
      body: {
        file: file(fileToTest.big, fileToTest.bigName),
      },
      headers: positiveHeader,
      expectedCase: {
        ["should return 400"]: (_parsed, res) => res.status === 400,
      },
      config: config,
      tags: tags,
    });
  }

  // --- Positive Case ---
  const uploadResult = assertHandler({
    currentTestName: "valid payload",
    featureName: featureName,
    route: route,
    body: positivePayload,
    headers: positiveHeader,
    expectedCase: {
      ["should return 200"]: (_parsed, res) => res.status === 200,
      ["should have fileId"]: (parsed, _res) =>
        isExists(parsed, "fileId", ["string"]),
      ["should have fileUri"]: (parsed, _res) =>
        isExists(parsed, "fileUri", ["string"]),
      ["should have fileThumbnailUri"]: (parsed, _res) =>
        isExists(parsed, "fileThumbnailUri", ["string"]),
    },
    config: config,
    tags: tags,
  });

  if (uploadResult.isSuccess) {
    return getFile(uploadResult.res, {}, featureName);
  } else {
    console.warn(
      `${featureName} | Skipping getFile due to failed upload assertions.`,
    );
    return undefined;
  }
}
