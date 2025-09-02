import http from "http";
import { URL } from "url";
import getPort from "get-port";
import isReachable from "is-reachable";

/**
 * @typedef {Object} RouteHandler
 * @property {(req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>} handler The route handler function
 */

/**
 * @typedef {Object} RequestBody
 * @property {any} [data] The parsed request body data
 */

/**
 * @typedef {'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'} HttpMethod
 */

/**
 * @typedef {Object.<HttpMethod, Object.<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>>>} RouteMap
 */

/**
 * @typedef {Object} ServerConfig
 * @property {boolean} [cors] Enable CORS headers
 * @property {string} [corsOrigin] CORS origin, defaults to '*'
 */

class TestServer {
  /** @type {http.Server|null} */
  #server = null;

  /** @type {RouteMap} */
  #routes = {
    GET: {
      "/": /** @type {(req: http.IncomingMessage, res: http.ServerResponse) => undefined} */ (
        _,
        res,
      ) => {
        this.sendJsonResponse(res, 200, { status: "ok" });
      },
    },
    POST: {},
    PUT: {},
    DELETE: {},
    PATCH: {},
  };

  /** @type {Required<ServerConfig>} */
  #config = { cors: true, corsOrigin: "*" };

  /**
   * Initialize the test server
   * @param {ServerConfig} [config] Server configuration
   */
  constructor(config = {}) {
    this.#config = { ...this.#config, ...config };
  }

  /**
   * Configure CORS headers
   * @param {http.ServerResponse} res
   */
  #setCorsHeaders(res) {
    if (this.#config.cors) {
      res.setHeader("Access-Control-Allow-Origin", this.#config.corsOrigin);
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH",
      );
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
  }

  /**
   * Extract value from request, ex:
   * // request comes from `http://localhost/test/value`
   * getPathValue(req, 0) => return "test"
   * getPathValue(req, 1) => return "value"
   * @param {http.IncomingMessage} req
   * @param {number} index
   * @returns {string}
   */
  getGetPathValue(req, index) {
    if (req.url) {
      const pathnames = req.url.split("/");
      return this.decodeURIComponentManual(pathnames[index]);
    }
    return "";
  }

  /**
   * Extract parameters from a request
   * @param {http.IncomingMessage} req
   * @returns {Object}
   */
  /**
   * Manually parse query parameters from URL string
   * @param {http.IncomingMessage} url - The full URL from req.url
   * @returns {{ [key: string]: string | string[] }} Parsed query parameters
   */
  parseQueryParams(url) {
    /**
     * @type {{ [key: string]: string | string[] }}
     */
    const params = {};

    if (!url.url) return {};

    // Find the question mark
    const queryStart = url.url.indexOf("?");
    if (queryStart === -1) return params; // No query string

    // Get everything after the ?
    const queryString = url.url.substring(queryStart + 1);

    // Split by & to get key=value pairs
    const pairs = queryString.split("&");

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      if (!pair) continue; // Skip empty pairs

      // Find the = sign
      const equalIndex = pair.indexOf("=");

      let key, value;
      if (equalIndex === -1) {
        // No = sign, treat as key with empty value
        key = pair;
        value = "";
      } else {
        key = pair.substring(0, equalIndex);
        value = pair.substring(equalIndex + 1);
      }

      // Decode URL-encoded characters manually
      key = this.decodeURIComponentManual(key);
      value = this.decodeURIComponentManual(value);

      // Handle multiple values for same key (convert to array)
      if (params[key] !== undefined) {
        let currentVal = params[key];
        if (Array.isArray(currentVal)) {
          currentVal.push(value);
        } else {
          currentVal = [currentVal, value];
          params[key] = currentVal;
        }
      } else {
        params[key] = value;
      }
    }

    return params;
  }

  /**
   * Manually decode URL-encoded characters (simplified version)
   * @param {string} str
   * @returns {string}
   */
  decodeURIComponentManual(str) {
    // Replace + with spaces (common in form data)
    str = str.replace(/\+/g, " ");

    // Handle % encoding
    let result = "";
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "%" && i + 2 < str.length) {
        // Get the two hex digits after %
        const hexCode = str.substring(i + 1, i + 3);

        // Convert hex to decimal then to character
        const charCode = parseInt(hexCode, 16);
        if (!isNaN(charCode)) {
          result += String.fromCharCode(charCode);
          i += 2; // Skip the two hex digits
        } else {
          result += str[i]; // Invalid encoding, keep as is
        }
      } else {
        result += str[i];
      }
    }

    return result;
  }

  /**
   * Parse JSON body from incoming request
   * @param {http.IncomingMessage} req
   * @returns {Promise<any>}
   */
  async getRequestBody(req) {
    /** @type {Buffer[]} */
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Send JSON response
   * @param {http.ServerResponse} res
   * @param {number} statusCode
   * @param {Object} data
   */
  sendJsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  /**
   * Add a route handler
   * @param {HttpMethod} method HTTP method
   * @param {string} path Route path
   * @param {(req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>} handler Route handler
   */
  addRoute(method, path, handler) {
    const upperMethod = method.toUpperCase();
    if (!this.#routes[upperMethod]) {
      this.#routes[upperMethod] = {};
    }
    this.#routes[upperMethod][path] = handler;
  }

  /**
   * Start the server
   * @returns {Promise<number>} The port number the server is listening on
   */
  async start() {
    if (this.#server) {
      throw new Error("Server is already running");
    }

    const port = await getPort();
    return new Promise(
      /** @param {(value: number) => void} resolve @param {(reason: Error) => void} reject */ (
        resolve,
        reject,
      ) => {
        this.#server = http.createServer(async (req, res) => {
          this.#setCorsHeaders(res);
          if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
          }

          try {
            const url = req.url || "/";
            const host = req.headers.host || "localhost";
            const parsedUrl = new URL(url, `http://${host}`);
            const pathname = parsedUrl.pathname;
            const method = req.method || "GET";

            if (this.#routes[method] && this.#routes[method][pathname]) {
              await this.#routes[method][pathname](req, res);
            } else {
              this.sendJsonResponse(res, 404, { error: "Not Found" });
            }
          } catch (error) {
            console.error("test server | ", "response error:", error);
            this.sendJsonResponse(res, 500, { error: "Internal Server Error" });
          }
        });

        const timeout = setTimeout(() => {
          reject(new Error("Server initializing timeout"));
        }, 2000);

        this.#server.on("error", (err) => {
          console.error("test server | ", "startup error :", err);
          clearTimeout(timeout);
          reject(err);
        });

        this.#server.on("listening", async () => {
          const isConnectable = await isReachable(`http://127.0.0.1:${port}`);
          if (!isConnectable) {
            console.log("test server | ", port, "is not connectable");
            this.#server?.close();

            clearTimeout(timeout);
            reject(
              new Error(`Server started but port ${port} is not connectable`),
            );
            return;
          }
          clearTimeout(timeout);
          resolve(port);
        });

        if (!this.#server) {
          clearTimeout(timeout);
          reject(new Error("Failed to create server"));
          return;
        }

        this.#server.listen(port);
      },
    );
  }

  /**
   * Stop the server
   * @returns {Promise<void>}
   */
  async stop() {
    return new Promise(
      /** @param {(value: void) => void} resolve @param {(reason: Error) => void} reject */ (
        resolve,
        reject,
      ) => {
        if (!this.#server) {
          resolve();
          return;
        }

        this.#server.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.#server = null;
            resolve();
          }
        });
      },
    );
  }
}

export default TestServer;
